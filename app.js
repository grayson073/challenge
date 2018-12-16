(() => {
  const fs = require('fs');
  const logFile = 'changelog.txt';
  const resultsFile = 'results.json';
  const leadData = JSON.parse(fs.readFileSync('leads.json', 'utf8')).leads;
  const ascii = require('./ascii');

  // Initialize changelog
  function createLog() {
    let msg = ascii + '\nChangelog created on ' + new Date().toLocaleString() + '\n' + '='.repeat(44) + '\n';
    fs.writeFileSync(logFile, msg);
    console.log('\nFile ' + logFile + ' created.\n');
  }

  // Sort leads in case of varied data sets
  function sortLeads(leads) {
    return leads.sort((a, b) => {
      if(a.entryDate < b.entryDate) return -1;
      if(a.entryDate > b.entryDate) return 1;
      return 0;
    });
  }

  // Locate index for logging
  function findIndex(leadToFind) {
    for(let i = 0; i < leadData.length; i++) {
      if(leadData[i]._id === leadToFind._id) return i;
    }
  }

  // Log message of updates
  function logRemoval(lead, hashTable, key, property) {
    let originalIndex = findIndex(lead, property);
    const msg = 'Record revised at ' + originalIndex + ' FROM: ' + property + ' ' + hashTable[lead[key]][property] + ' TO ' + lead[property] + '\n';
      
    fs.appendFileSync(logFile, msg);
    console.log(msg);
  }

  // Use dictionary to update records based on duplicate _ids
  function updateRecordsById() {
    let leads = sortLeads(leadData);
    let idDict = {};

    for(let i = 0; i < leads.length; i++) {
      let lead = leads[i];
      if(!idDict[lead._id]) idDict[lead._id] = lead._id;
      if(idDict[lead._id].email !== undefined && idDict[lead._id].email !== lead.email){
        logRemoval(lead, idDict, '_id', 'email');
      }
      idDict[lead._id] = { ...lead };
    }

    // Return filtered array with updated emails and duplicate _ids removed
    return Object.keys(idDict).map((key => {
      const lead = idDict[key];
      return { _id: key, ...lead };
    }));
  }

  // Use dictionary to update records based on duplicate emails
  function updateRecordsByEmail() {
    let leads = updateRecordsById();
    let emailDict = {};

    for(let i = 0; i < leads.length; i++) {
      let lead = leads[i];
      if(!emailDict[lead.email]) emailDict[lead.email] = lead.email;
      if(emailDict[lead.email]._id !== undefined && emailDict[lead.email]._id !== lead._id){
        logRemoval(lead, emailDict, 'email', '_id');
      }
      emailDict[lead.email] = { ...lead };
    }

    // Return fully updated array
    return Object.keys(emailDict).map((key => {
      const lead = emailDict[key];
      return { email: key, ...lead };
    }));
  }

  createLog();

  let results = { 'leads': sortLeads(updateRecordsByEmail()) };
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, '\t'));
  console.log('Output written to ' + resultsFile + '.\n');
})();