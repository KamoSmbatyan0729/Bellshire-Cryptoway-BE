

const cron = require('node-cron');
const db = require('../config/db');
const { getContract } = require('../web3/contract');
const Web3 = require('web3');

require('dotenv').config();

const getWalletAddress = async () => {
  const query = 'SELECT wallet_address FROM users';
  const result = await db.execute(query, [], { prepare: true });

  return result.rows.map(row => row.wallet_address);
}

const getUserActivationScore = async (walletAddress) => {
  const now = new Date();

  // Start of yesterday
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - 1);
  startDate.setHours(0, 0, 0, 0);

  // Start of today (end of yesterday range)
  const endDate = new Date(now);
  endDate.setHours(0, 0, 0, 0);

  const millisecondsInDay = 24 * 60 * 60 * 1000;

  const queries = [
    { query: `SELECT content, sent_at, attachment_url FROM messages WHERE sender_wallet = ? ALLOW FILTERING` },
    { query: `SELECT content, sent_at, attachment_url FROM dm_messages WHERE sender_wallet = ? ALLOW FILTERING` },
  ];

  let allMessages = [];

  for (const { query } of queries) {
    const result = await db.execute(query, [walletAddress], { prepare: true });
    const filtered = result.rows.filter(row => {
      const sentAt = new Date(row.sent_at);
      return sentAt >= startDate && sentAt < endDate;
    });
    allMessages = allMessages.concat(filtered);
  }

  if (allMessages.length === 0) {
    return 0; // no activity yesterday
  }

  let weightedMessageCount = 0;
  let weightedAttachmentCount = 0;
  let weightedLengthSum = 0;

  for (const row of allMessages) {
    const sentAt = new Date(row.sent_at);
    const recencyWeight = (sentAt - startDate) / millisecondsInDay; // from 0 to 1

    weightedMessageCount += recencyWeight;
    if (row.attachment_url) {
      weightedAttachmentCount += recencyWeight;
    }
    weightedLengthSum += (row.content?.length || 0) * recencyWeight;
  }

  const averageWeightedLength = weightedLengthSum / weightedMessageCount;

  // Final score calculation
  const score = (
    weightedMessageCount * 1 +           // messages: 1 point each
    weightedAttachmentCount * 3 +        // attachments: 3 points
    averageWeightedLength / 100          // scale down long messages
  );

  return Math.round(score); // integer score
};

const prepareActivationScoreData = async () => {
  const walletAddresses = await getWalletAddress();
  const addresses = [];
  const scores = [];

  for (const wallet of walletAddresses) {
    try {
      const score = await getUserActivationScore(wallet);
      addresses.push(wallet);
      scores.push(score);
    } catch (err) {
      console.error(`Failed to score wallet ${wallet}:`, err.message);
    }
  }

  return { addresses, scores }; // ← ready for contract call
};


async function recordUserActivity() {
  try {
    const { addresses, scores } = await prepareActivationScoreData();
    const contract = getContract();

    // Prepare the tx data
    const receipt = await contract.methods.recordUserActivity(addresses, scores).send({
      from: process.env.OWNER_ADDRESS,
      gas: 200000 // Adjust gas limit as needed
    });
    console.log('Transaction receipt:', receipt);

  } catch (error) {
    console.error('❌ Error calling contract:', error.message || error);
  }
}

async function getUserDetails() {
  try {
    const contract = getContract();
    const { addresses, scores } = await prepareActivationScoreData();

    for (wallet of addresses) {
      const result = await contract.methods.getUserDetails(wallet).call();
      const parsed = {
        stakedAmount: Number(result.stakedAmount),
        stakeTimestamp: Number(result.stakeTimestamp),
        lastActivityScore: Number(result.lastActivityScore),
        lastRewardClaim: Number(result.lastRewardClaim),
        isActivated: result.isActivated,
      };

      console.log('✅ User Details:', parsed);
    }

    console.log("Raw result:", result);
  } catch (err) {
    console.error('❌ Failed to fetch user details:', err.message || err);
  }
}

cron.schedule('00 09 * * *', async () => {
  console.log("cronjob called!!!!!!!!!!!!!!!");
  await recordUserActivity();
  await getUserDetails();
});
