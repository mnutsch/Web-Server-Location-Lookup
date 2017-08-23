/************************************************************************
 * Name: Web Server Location Lookup
 * Date Created: 8-22-2017
 * Author: Matt L. Nutsch
 * Description: This app looks up the location of a web server based on its IP address.
 * *********************************************************************/

var http = require("http");
var https = require("https");
var util = require("util");
const dns = require('dns'); //used to translate a domain to an ip address

var express    = require('express');
var Webtask    = require('webtask-tools');
var bodyParser = require('body-parser');
var app = express();

var userCity = null;
var ip = null;
var webdomain = '';
var userDefinedWebDomain = null;

app.use(bodyParser.json());

app.get('/', function(req, res) 
{
  
  userDefinedWebDomain = req.query.domain;
  if(userDefinedWebDomain !== null)
  {
    webdomain = userDefinedWebDomain;
  }
  
  //****************************************
  //get the web domain's IP address
  //****************************************
  dns.lookup(webdomain, function(err, result) 
  {
    ip = result;
  })
  
  //****************************************
  //CALL ANOTHER API
  //****************************************
  var IPLookupURL = 'http://ip-api.com/json/' + ip;
  http.get(IPLookupURL, function(response) 
  {
    
    //the connection to the other API was successful
    
    // Continuously update stream with data
    var body = '';
    response.on('data', function(d) 
    {
        body += d;
    });
    response.on('end', function() 
    {
      
      //parse the JSON from the other API
      var parsed = JSON.parse(body);
     
      var streamResponse = util.inspect(response); 
      
      function setCity(param, callback) 
      {
        userCity = param;
        callback();
      } 
      
      userCity = parsed.city;
      
      //****************************************
      //render the HTML to the user
      //****************************************
      const HTML = renderView({
        title: 'Web Server Location Lookup',
        body: '<h3>Web Server Location Lookup</h3>' + 
        '<br/>' + 
        '<div><span>This app looks up the location of a web server based on its IP address.</span>' +
        '<br/><br/>' + 
        '<span>Add a website domain to the URL as a GET variable called \'domain\'.</span>' +
        '<br/>' + 
        '<span>Example: <a href="https://wt-992ea3ee5554a9d5e91fed08ba052295-0.run.webtask.io/express?domain=www.google.com">https://wt-992ea3ee5554a9d5e91fed08ba052295-0.run.webtask.io/express?domain=www.google.com</a></span>' +
        '<br/><br/>' + 
        '<span>The web domain received is: ' + webdomain + '</span>' +
        '<br/>' + 
        '<span>The IP Address of the web domain is: ' + ip + '</span>' +
        '<br/>' + 
        '<span>The closest city to the IP Address is ' + userCity  + '</span>'
        + '<script>window.onload = function() {'
        + 'if(!window.location.hash) {'
        + 'window.location = window.location + "#loaded";'
        + 'window.location.reload();'
        + '}'
        + '}</script>'
        + '<br/>'
        + '<span>(If the city does not update immediately, then refresh the page.)</span>'
        + '<br/><br/><br/>' 
        + '<span>Written by Matt L. Nutsch, 8-22-2017</span>'
        + '</div>'
      });
      
      //output the response
      res.set('Content-Type', 'text/html');
      res.status(200).send(HTML);
      
    });
    
    }).on('error', function(e) 
    {
      //the connection to the other API failed
      res.sendStatus(500);
    }).end();
});

module.exports = Webtask.fromExpress(app);

//****************************************
//Helper function to render HTML
//****************************************
function renderView(locals) 
{
  return (`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${locals.title}</title>
    </head>

    <body>
      ${locals.body}
    </body>
    </html>
  `);
}

