

const getUserCommunicationQuality = async (walletAddress, date) => {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
  
    const queries = [
      {
        table: 'messages',
        query: `SELECT content, sent_at, attachment_url FROM bellshire.messages WHERE sender_wallet = ? ALLOW FILTERING`,
      },
      {
        table: 'dm_messages',
        query: `SELECT content, sent_at, attachment_url FROM bellshire.dm_messages WHERE sender_wallet = ? ALLOW FILTERING`,
      },
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
  
    const totalMessages = allMessages.length;
    const totalLength = allMessages.reduce((sum, row) => sum + (row.content?.length || 0), 0);
    const attachmentCount = allMessages.filter(row => row.attachment_url).length;
  
    const averageLength = totalMessages > 0 ? totalLength / totalMessages : 0;
  
    return {
      walletAddress,
      date,
      totalMessages,
      averageMessageLength: averageLength.toFixed(2),
      attachmentCount,
    };
  };

  module.exports = {getUserCommunicationQuality};