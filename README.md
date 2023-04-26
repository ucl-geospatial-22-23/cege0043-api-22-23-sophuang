# Technical Guide for the API Component

This guide covers the API component, which includes building endpoints to fetch and upload data from and into the database. This allows the APP component to function properly.

## 1. System Requirements

- This API requires connections to an Ubuntu Server (Virtual Machine). You can use Cyberduck or other SSH software to connect to the Ubuntu Server.
- The API will work only if you are connected to a UCL network, i.e., either in the UCL campus using UCL Wi-Fi, or connected to the UCL VPN if you are outside the campus.
  - For help in connecting to the VPN, visit [UCL VPN Guide](https://www.ucl.ac.uk/isd/services/get-connected/ucl-virtual-private-network-vpn)
- There are no specific requirements for software versions, browser versions, or hardware versions.
- No external libraries are used.

## 2. Deployment

- Connect the virtual machine to the CEGE server.
- Ensure you have a `certs` file.
- Make sure you have the `postGISConnection.js` file in the path: `/home/YourServerUserName/certs`
  - This file should contain your database connection information, such as:
    - host: cege0052.cege.ucl.ac.uk
    - user: userxxx (where xxx is your user ID)
    - database: ucfscde
    - password: your_database_connection_password
    - port: 5432
- Open the terminal and change the working directory to the API files:

  ```
  cd /home/YourServerUserName/code
  ```

- Clone the main branch of the repository `https://github.com/ucl-geospatial-22-23/cege0043-api-22-23-sophuang` into the `code` folder:

  ```
  git clone https://github.com/ucl-geospatial-22-23/cege0043-api-22-23-sophuang.git
  ```

- Change the working directory to the API folder:

  ```
  cd cege0043-api-22-23-sophuang
  ```

- Install Express and start the NodeJS server (dataAPI.js):

  ```
  npm install express --save
  node dataAPI.js
  ```

- Ensure the NodeJS server is started successfully. If any errors occur, you can enter debug mode through the command line window by typing:

  ```
  node --inspect dataAPI.js
  ```

## 3. Testing Endpoints

There are two types of endpoints:

- `GET`
- `POST`

To test a POST endpoint, you can run different functions in the APP component to get the data and check for errors. For GET endpoints, you can enter the endpoint URL into a browser.

- Ensure your device is connected to UCL Wi-Fi or UCL VPN.
- Make sure the NodeJS server is active.
- While testing the POST endpoint, use the Developer mode of the browser to see if any error occurs.

## 4. File Description

- `~/routes/crud.js`
  - This JavaScript file stores endpoint building for data fetch or upload that is not related to GeoJSON data.
  - Endpoints:
    - /userId
    - /insertAssetPoint
    - /insertConditionInformation
    - /deleteAsset
    - /deleteConditionReport
- `~/routes/geoJSON.js`
  - This JavaScript file stores endpoint building for data fetch or upload that is related to GeoJSON data.
  - Endpoints:
    - /conditionDetails
    - /userAssets/:user_id
    - /userConditionReports/:user_id
    - /userRanking/: user_id
    - /assetsInGreatCondition
    - /dailyParticipationRates
    - /userFiveClosestAssets/:latitude/:longitude
    - /lastFiveConditionReports/:user_id
    - /conditionReportMissing/:user_id

- `~/dataAPI.js`
  - The NodeJS server for the API component.

- `~/package-lock.json` and `~/package.json`
  - Manifest files used by `dataAPI.js` to manage the project's metadata, dependencies, scripts, and other configurations.

## 5. Code Reference

Code for building endpoints adapts the SQL code provided in the module materials: `SQL-for-assignment-2023-2.txt`.

## 6. Details of Testing GET Endpoints

- First, start the `dataAPI.js`.
- Type the URL in the browser to see the results.
- For example:
  - `/conditionDetails`
    - `https://YourVMServer/api/conditionDetails`
  - `/userAssets/:user_id`
    - `https://YourVMServer/api/userAssets/:user_id`

Replace `:user_id` with your user ID (xxx).

