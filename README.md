# Setting up an environment for labs

## Introduction
To work with labs on Apigee Edge developer training, a target endpoint is needed. This utility will set one up for you, using API BaaS from Apigee product family. 

When you create an Apigee Edge account, an API BaaS organization is automatically provisioned for you. API BaaS provides a REST interface on top of a flexible data store. We will use this REST interface as a target endpoint to work through labs on Edge developer training. See [docs](http://docs.apigee.com/app-services/content/creating-apigee-account) for more details on setting up an account.

As we work through the lab material we'll try to develop APIs for a ficticious e-commerce company called Moon Digital. The utility will setup a sample data store with APIs to act as Moon Digital's backend e-commerce services for product management, order management, inventory management, etc. 

## Usage
### Prerequisites
- You need an Apigee Edge developer account. See [docs](http://docs.apigee.com/api-services/content/creating-apigee-edge-account) for more details on how to setup your account.
- You'll need [Node.js](https://nodejs.org/en/download/) installed on your local machine. This will also install node's package manage [npm](https://www.npmjs.com/).

### Edit config.js
Edit config.js to configure your API BaaS org, app and other details.

```javascript
var config = {} ;

config.org = 'yourOrg';
config.app = 'yourApp';
config.uri = "http://api.usergrid.com" ;
config.clientId = 'your org client Id';
config.clientSecret = 'your org client secret';

module.exports = config ;

```

- When you [login](https://apigee.com/apibaas) to API BaaS, select an org on the top level menu. You'll likely have just one org if you have just registered. Set the name of the org to `config.org` property on config.js file.
- On the "Administration" tab in the Organization section, you can find the "CLIENTID" and "CLIENT SECRET". It is important to copy the org level client Id and secret and not the app level client Id and secret. Update these values on the ```config.clientid``` and ```config.clientSecret``` properties on config.js file.
- Optionally, you can create an app yourself (on the Administration tab of API BaaS management UI) or the script will do it for you. The script will create an app in the org if it is not already available. Enter the name of the app in the ```config.app``` property on config.js file.

### Running the script
Execute the following commands to run the script that sets up labs target endpoint.

- Get to the setup directory from a command prompt which can executte Node.js scripts. Then install dependencies and run the upload script

```bash
$ npm install
$ node upload.js
```
Or

```bash
$ npm start
```

The script will setup a sandbox environment for labs based on the values specified in the config.js file.

### Other scripts
The utility also provides scripts for cleaning up the sandbox environment or to download current data from sandbox environment.

To download data from the labs sandbox environment specified in config.js file:

```bash
$ npm install
$ node download.js
```

To cleanup data from the labs sandbox environment as specified in config.js file:

```bash
$ npm install
$ node cleanup.js
```

## Lab sandbox: Resources
The following target URLs/resources should be available if the setup has run correctly.

```bash
$ curl -X GET https://apibaas-trial.apigee.net/{org}/{app}/categories
$ curl -X GET https://apibaas-trial.apigee.net/{org}/{app}/products
$ curl -X GET https://apibaas-trial.apigee.net/{org}/{app}/skus
$ curl -X GET https://apibaas-trial.apigee.net/{org}/{app}/carts
$ curl -X GET https://apibaas-trial.apigee.net/{org}/{app}/orders
$ curl -X GET https://apibaas-trial.apigee.net/{org}/{app}/stores
```

In addition to above, you should be able to check for individual entities from the response. For example, you can check a particular product by it UUID

```bash
$ curl -X GET https://apibaas-trial.apigee.net/{org}/{app}/products/{uuid}
```

You should also be able to get related entities. For example:

```bash
$ curl -X GET https://apibaas-trial.apigee.net/{org}/{app}/products/{uuid}/availability/skus
```

However if you want to modify any entity (PUT/POST/DELETE), a 401 unauthorized error will be thrown. For example:

```bash
$ curl -X DELETE https://apibaas-trial.apigee.net/{org}/{app}/products/{uuid}
```

To make this work you need to provide either org level or app level client Id and secret as basic authentication. The client Id and secret can be obtained from the API BaaS management UI. Fill in your org and app name and copy paste this URL in a browser - https://apigee.com/apibaas/orgs/{your org}/apps/{your app}/administration.

```bash
$ curl -X DELETE -u {clientId:clientSecret} https://apibaas-trial.apigee.net/{org}/{app}/products/{uuid}
```

## Note
All of the material here is released under the [MIT license](https://github.com/gahana/edge-trg-labs/blob/master/LICENSE.md)

## Support
If you have any questions, please get in touch with your training instructor or search and ask questions on [community](https://community.apigee.com/index.html)
