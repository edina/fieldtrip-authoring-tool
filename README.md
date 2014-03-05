fieldtrip-authoring-tool
========================

A web app for creating customs html5 forms that can be synchronized through an API called Personal Cloud API (PCAPI) with the user's dropbox account.

Software Requirements
=====================

- Fabric
- Nodejs/npm

## Installation Instructions

- Fabric

``` 
apt-get install python-setuptools  # for easy_install
easy_install pip
pip install fabric
```

- Nodejs/npm
Follow the instructions here:

http://nodejs.org

### Installation instructions of the app

1. Prepare a configuration file
Go and check the template for this which is inside etc/config.example. Create a config.ini out of it and save it in the same path or store it on a server and add the path of the server on the config.ini.

2. Go to the home path of you cloned project and run:
```
fab -l
```
A series of functions will be listed.

3. For preparing your app
```
fab install
```

4. For deploying to a web server:
```
fab server:'<server>' setup deploy
```
where server is the name of the server you have added in the config.ini file.

License
----

BSD


**Free Software, Hell Yeah!**

[Installation guide]:http://developer.android.com/sdk/installing/index.html









