/**
 * Returns a representative emoji icon based on topic ID or name
 * @param {string} topicId 
 * @param {string} name 
 * @returns {string}
 */
export const getTopicIcon = (topicId, name = '') => {
  const id = (topicId || '').toLowerCase();
  const lowerName = (name || '').toLowerCase();
  
  if (id === 'machine_learning' || lowerName.includes('machine learning') || lowerName.includes('ml')) return '🤖';
  if (id === 'artificial_intelligence' || lowerName.includes('artificial intelligence') || lowerName.includes(' ai ') || lowerName.startsWith('ai ')) return '🧠';
  if (id === 'cloud_computing' || lowerName.includes('cloud computing') || lowerName.includes('cloud')) return '☁️';
  if (id === 'data_science' || lowerName.includes('data science') || lowerName.includes('statistics')) return '📊';
  if (id === 'cyber_security' || lowerName.includes('cyber security') || lowerName.includes('cryptography') || lowerName.includes('security')) return '🔒';
  if (id === 'blockchain' || lowerName.includes('blockchain') || lowerName.includes('distributed ledger')) return '🔗';
  if (id === 'computer_networks' || lowerName.includes('computer network') || lowerName.includes('networking') || lowerName.includes('tcp')) return '🌐';
  if (id === 'operating_systems' || lowerName.includes('operating system') || lowerName.includes('linux') || lowerName.includes('windows')) return '💻';
  if (id === 'dbms' || id === 'database_management_systems' || lowerName.includes('database') || lowerName.includes('sql') || lowerName.includes('dbms')) return '🗄️';
  if (id === 'internet_of_things' || lowerName.includes('internet of things') || lowerName.includes('iot')) return '🔌';
  
  return '📚'; // Default books
};
