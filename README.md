parse-nimble
===============

Parse Cloud Code wrapper for Nimble CRM API

## Installation

```
git clone http://github.com/flovilmart/parse-nimble.git
```

## Methods

**getAuthorizationUrl(params)**:

Generates the authorization url for authentication process http://nimble.readthedocs.org/en/latest/obtaining_key/#authorization-process-overview.

'params': should contain redirect_uri.

**requestToken(code, function(err, accessToken, refreshToken, results) {})**:

Performs authentication token request as a POST using the code sent to the redirect_uri (http://nimble.readthedocs.org/en/latest/obtaining_key/#authorization-process-overview STEP B).
We need to have available the same redirect_uri that is provided in step B for this step.
This can be provided:
A) In the constructor
B) Using the same Nimble object for getAuthorizationUrl and requestToken, as the getAuthorizationUrl function assigns this value

'code': Authorization Grant Code received at the redirect_uri.

**refreshToken(refreshToken, function(err, accesToken, refreshToken, results) {})**:

Refreshes the authorization token in case it has expired.
You can provide the refreshToken received from Nimble or let the wrapper use the refreshToken provided to the constructor.

'refreshToken': Refresh Token provided by Nimble 

**findContacts(params, function(err, results, response) {})**:

Performs contacts listing.

http://nimble.readthedocs.org/en/latest/contacts/basic/list.html

**findByFIELD(value, exactly, function(err, results, response) {})**:

For each one of the available search fields, we define a shortcut method findByFIELD.
These methods receive an exactly parameter that tells if the search is to be made with the "is" operator, or, when available, the "contain" operator.

http://nimble.readthedocs.org/en/latest/contacts/basic/search.html#available-search-fields

TODO: Allow search fields "company last contacted", "created" and "updated".

**findContactsId(params, function(err, results, response){})**:

Performs contacts listing using the /ids endpoint, where only ids will be returned.

http://nimble.readthedocs.org/en/latest/contacts/basic/list.html

**findContactsById(ids, function(err, results, response) {})**:

Gets contacts by their id.
May receive a comma separated list of ids, a single id, or an array of ids

http://nimble.readthedocs.org/en/latest/contacts/basic/details.html

**createContact(params, function(err, results, response) {})**:

Creates contacts.

http://nimble.readthedocs.org/en/latest/contacts/basic/create.html

**updateContact(id, params, function(err, results, response) {})**:

Updates contacts.

http://nimble.readthedocs.org/en/latest/contacts/basic/update.html

**deleteContact(ids, function(err, results, response) {})**:

Deletes contacts.
May receive a comma separated list of ids, a single id, or an array of ids.

http://nimble.readthedocs.org/en/latest/contacts/basic/delete.html

**showNote(id, function(err, results, response) {})**:

Gets notes by their id.

http://nimble.readthedocs.org/en/latest/contacts/notes/show.html 

**listContactNotes(id, function(err, results, response) {})**:

List contact notes, providing contact id.

http://nimble.readthedocs.org/en/latest/contacts/notes/show.html

**createNote(params, function(err, results, response) {})**:
 
Creates a note for the contacts contained in params.contacts_ids.

http://nimble.readthedocs.org/en/latest/contacts/notes/create.html

'params': required params for notes creation: contacts_ids, note, and note_preview

**udpateNote(id, params, function(err, results, response) {})**:

Updates a note, providing note id.

http://nimble.readthedocs.org/en/latest/contacts/notes/update.html

'params': required params for notes creation: contacts_ids, note, and note_preview

**deleteNote(id, function(err, results, response) {})**:

Deletes a note.

http://nimble.readthedocs.org/en/latest/contacts/notes/delete.html

**createTask(params, function(err, results, response) {})**:

Creates a new task.
As the due_date must have the format 'YYYY-MM-DD HOURS:MINUTES' we try to perform a conversion in case the string provided does not match the required format.

https://nimble.readthedocs.org/en/latest/activities/tasks/create.html

'params': required param for task creation: subject


## Usage

### Authentication
```javascript
var Nimble = require("cloud/Nimble.js");

// Init wrapper
var nimble = new Nimble({
  	appId: 'your_app_id',
  	appSecret: 'your_app_secret'
});


app.get('/nimble/authorization', function(req, res) {
    res.redirect(nimble.getAuthorizationUrl({redirect_uri: 'your_redirect_uri'}));
});


// You must make sure that the wrapper is using for requesting the access token the SAME
// redirect_uri provided for getAuthorizationUrl, either by using the same wrapper or by
// providing the redirect_uri in the wrapper constructor if you are using a new object for requestToken.

app.get('/nimble/authorization_callback', function(req, res) {
  if(!req.query.error) {
    nimble.requestToken(req.query.code, function(err, access_token, refresh_token, result) {
      res.send('You are now authenticated! -> ' + access_token);
    });
  } else {
    res.send('Error authenticating!!! -> ' + err);
  }
});

```

### Contacts

```javascript

app.get('/nimble/contacts', function(req, res) {
  nimble.findContacts({}, function(err, result, response) {
    if(err) return res.send('ERROR' + JSON.stringify(err));
    res.write('These are your contacts \n');
    result.resources.forEach(function(r) {
      res.write(JSON.stringify(r));
    })
    return res.end();
  });
});

app.get('/nimble/contacts/ids', function(req, res) {
  nimble.findContactIds({}, function(err, result, response) {
    if(err) return res.send('ERROR' + JSON.stringify(err));
    res.write('These are your contacts \n');
    result.resources.forEach(function(r) {
      res.write(JSON.stringify(r));
    })
    return res.end();
  });
});

app.post('/nimble/contacts/create', function(req, res) {
  nimble.createContact(
    {
      "fields": {
          "first name": [{
              "value": "Finn",
              "modifier": ""
          }],
          "last name": [{
              "value": "The Human",
              "modifier": ""
          }]
      }, 
      "type" : "person"
    }, function(err, result, response) {
      if(err) return res.send("ERROR" + JSON.stringify(err));
      return res.send(result);
    });
});

app.put('/nimble/contacts/update/:id', function(req, res) {
  nimble.updateContact( req.params.id,
    {
      "fields": {
          "first name": [{
              "value": "UPDATED",
              "modifier": ""
          }],
          "last name": [{
              "value": "UPDATED",
              "modifier": ""
          }]
      }
    }, function(err, result, response) {
      if(err) return res.send("ERROR" + JSON.stringify(err));
      return res.send(result);
    });
});

```

### Notes

```javascript

app.post('/nimble/notes/create', function(req, res) {
  var contact_ids = req.body.contact_ids;
  nimble.createNote({
    "contact_ids": contact_ids,
    "note": "NEW NOTE",
    "note_preview": "NEW NOTE PREVIEW"
  }, function(err, results, response) {
    if(err) return res.send('ERROR' + JSON.stringify(err));
    res.write('These are the notes CREATED \n');
    res.write(JSON.stringify(results));
    return res.end();
  });
});

app.put('/nimble/notes/:id/update', function(req, res) {
  var id = req.params.id,
  	  contact_ids = req.body.contact_ids;
  nimble.updateNote(id, {
    "contact_ids": contact_ids,
    "note": "NOTE UPDATEd",
    "note_preview": "NOTE PREVIEW UPDATED"
  }, function(err, results, response) {
    if(err) return res.send('ERROR' + JSON.stringify(err));
    res.write('These are the notes CREATED \n');
    res.write(JSON.stringify(results));
    return res.end();
  });
});

app.delete('/nimble/notes/:id/delete', function(req, res) {
  var id = req.params.id;
  nimble.deleteNote(id,
    function(err, results, response) {
      if(err) return res.send('ERROR' + JSON.stringify(err));
      res.write('These are the notes DELETED \n');
      res.write(JSON.stringify(results));
      return res.end();
  });
});


app.get('/nimble/notes/:id', function(req, res) {
  var id = req.params.id;
  nimble.showNote(id, function(err, results, response) {
    if(err) return res.send('ERROR' + JSON.stringify(err));
    res.write('This is the note \n');
    res.write(JSON.stringify(results));
    return res.end();
  });
});

app.get('/nimble/contact/:id/notes', function(req, res) {
  var id = req.params.id;
  nimble.listContactNotes(id, function(err, results, response) {
    if(err) return res.send('ERROR' + JSON.stringify(err));
    res.write('These are the notes \n');
    res.write(JSON.stringify(results));
    return res.end();
  });
});


```

### Tasks

```javascript

app.post('/nimble/tasks/create', function(req, res) {
  nimble.createTask({
    "related_to": req.body.ids,
    "notes": "Random text",
    "subject": "Send'em a bunch of mails",
    "due_date": "2011-10-22 17:30"
  }, function(err, results, response) {
    if(err) return res.send('ERROR' + JSON.stringify(err));
    res.write('These are the tasks CREATED \n');
    res.write(JSON.stringify(results));
    return res.end();
  });
});

```