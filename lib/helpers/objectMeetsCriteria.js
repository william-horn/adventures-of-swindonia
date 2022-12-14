/*
@author William J. Horn

documentation coming soon
*/

// objectMeetsCriteria(connection, [
//   {key: 'name', equals: 6, excludeUndefined: true},
//   {key: 'handler', equals: undefined, excludeUndefined: true}

// ])

const objectMeetsCriteria = (object, criteria) => {
  for (let i = 0; i < criteria.length; i++) {
    const rule = criteria[i];
    
    if (
      !(rule.ignoreUndefined && rule.equals === undefined) 
        && !(rule.equals === object[rule.key])
      ) {
      return false;
    }
  }

  return true;
}

module.exports = objectMeetsCriteria;
