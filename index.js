const filterKeyword = (script, keyword) => {
    const filtered = script.words.filter(
      word => word.word.toLowerCase() === keyword.toLowerCase()
    );
   
    return filtered;
   };
   
   module.exports = { filterKeyword };