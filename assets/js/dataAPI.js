

const getAPIData = async (_apiURL, _headers = null) => {
  var response;
  try {
    if (_headers) {
      response = await fetch(_apiURL, _headers);
    } else {
      response = await fetch(_apiURL);
    }
    if (!response.ok) {
      alertAPIFailure("failed API call");
    }
  } catch (err) {
      alertAPIFailure(err);
  }
  const json = await response.json();
  return await json;
};

var alertEl = document.createElement("div");
var alertBtnEl = document.createElement("button");
var alertParentEl = document.querySelector("main section .columns .column");

var alertAPIFailure = function (msg) {
  alertEl.style.display = "flex";
  alertEl.style.alignContent = "center";
  alertEl.style.alignItems = "center";
  alertEl.style.justifyContent = "center";
  alertEl.style.flexDirection = "column";
  alertEl.style.position = "fixed";
  alertEl.style.width = "300px";
  alertEl.style.height = "100px";
  alertEl.style.backgroundColor = "yellow";
  alertEl.style.zIndex = "1";
  alertEl.style.fontSize = "20px";
  alertEl.textContent = msg;
  alertBtnEl.style.height = "50px";
  alertBtnEl.style.width = "100px";
  alertBtnEl.style.backgroundColor = "red";
  alertBtnEl.style.color = "black";
  alertBtnEl.style.justifyContent = "center";
  alertBtnEl.style.alignItems = "center";
  alertBtnEl.textContent = "CONFIRMED";
  alertEl.appendChild(alertBtnEl);
  alertParentEl.appendChild(alertEl);
  alertBtnEl.addEventListener("click", clearAlert);
};

var clearAlert = function () {
  removeAllChildNodes(alertEl);
  alertEl.remove();
};

/**
 * drivingDistance() - Driving distance and drive time
 *    from shopper address to brick and mortar retailer.
 * Pertinent keys to pull from returned JSON
 *    .resourceSets[0].resources[0].travelDistance (miles)
 *    .resourceSets[0].resources[0].travelDuration (seconds)
 *    .resourceSets[0].resources[0].travelDurationTraffic (seconds)
 * 
 * @param {string} _shopperAddr 
 * @param {string} _storeAddr 
 * @returns {object} JSON object containing
 *                      - distanceInMiles (between shopper and retail outlet) 
 *                      - avgTimeInSeconds (average drive-time to retail outlet) 
 *                      - trafficTimeInSeconds (traffic drive-time/real-time to retail outlet)
 */
const drivingDistance = async function (_shopperAddr, _storeAddr) {
  // transform parameters for URL syntax
  var shopperAddr = _shopperAddr.replaceAll(/,/g, ' ').replaceAll(/ +/g, ' ').replaceAll(' ', '+');
  var storeAddr = _storeAddr.replaceAll(/,/g, ' ').replaceAll(/ +/g, ' ').replaceAll(' ', '+');

  // construct the URL for virtual earth driving distance endpoint
  var apiURL = "https://dev.virtualearth.net/REST/v1/Routes?waypoint.1=" + shopperAddr + "&waypoint.2=" + storeAddr + "&distanceUnit=mi&o=json&c=en-GB&key=ApeHivnaztSwvGsBzGpbwnYJw9vAPSBI4LrGUh_YRYvmqZVRsrxjevRoSXGWi7M8"; // REST endpoint

  // execute the API call to the URL
  var jsonTravelDistance = await getAPIData(apiURL);
  if (jsonTravelDistance && jsonTravelDistance.failure) {

  }

  // parse out pertinent data content returned
  var distanceInMiles = jsonTravelDistance.resourceSets[0].resources[0].travelDistance;
  var avgTimeInSeconds = jsonTravelDistance.resourceSets[0].resources[0].travelDuration;
  var trafficTimeInSeconds = jsonTravelDistance.resourceSets[0].resources[0].travelDuration;

  // build a concise JSON object to return
  var json = {
    "distanceInMiles": Math.trunc(distanceInMiles),
    "avgTimeInMinutes": Math.trunc((avgTimeInSeconds / 60)),
    "trafficTimeInMinutes": Math.trunc((trafficTimeInSeconds / 60))
  };
  return json;
};

/**
 * targetLocator() - Target brick and mortar location search (to find closest location).
 * Pertinent keys to pull from returned JSON
 *    .locations[0].address.address_line1
 *    .locations[0].address.city
 *    .locations[0].address.state
 *    .locations[0].address.postal_code
 *    .locations[0].location_id   (needed for product search storeid parameter)
 * 
 * @param {string} _zipCode 
 * @param {string} _radiusInMiles 
 * @returns {object} JSON object containing
 *                      - address_line1 (street address) 
 *                      - city
 *                      - state
 *                      - postal_code (zipcode)
 *                      - location_id (of the store)
 */
const targetLocator = async function (_zipCode, _radiusInMiles) {
  // construct the URL for target-com-store-product-reviews-locations-data endpoint
  var apiURL = "https://target-com-store-product-reviews-locations-data.p.rapidapi.com/location/search?zip=" + _zipCode + "&radius=" + _radiusInMiles;  // REST endpoint
  var headers = {
    "method": "GET",
    "headers": {
      "x-rapidapi-host": "target-com-store-product-reviews-locations-data.p.rapidapi.com",
      "x-rapidapi-key": "9813878aa1msh7c70fcdc9bbf8a6p1e1f78jsn1ff70bded748"
    }
  };

  // execute the API call to the URL
  var jsonTargetLocation = await getAPIData(apiURL, headers);

  // parse out pertinent data content returned
  var address_line1 = await jsonTargetLocation.locations[0].address.address_line1;
  var city = await jsonTargetLocation.locations[0].address.city;
  var state = await jsonTargetLocation.locations[0].address.state;
  var postal_code = await jsonTargetLocation.locations[0].address.postal_code;
  var location_id = await jsonTargetLocation.locations[0].location_id;

  // build a concise JSON object to return
  var json = {
    "address": address_line1,
    "city": city,
    "state": state,
    "zipCode": postal_code,
    "location_id": location_id
  };
  return json;
};

/**
 * targetProductLocator() - Target product search
 * Pertinent keys to pull from returned JSON
 *    .products[0].item.enrichment.images.primary_image_url
 *    .products[0].item.product_description
 *    .products[0].price.current_retail or .products[0].price.formatted_current_price
 * 
 * @param {string} _location_id 
 * @param {string} _productDescription 
 * @returns {object} JSON object containing a list of items...each containing an
 *                        - image (thumbnail image of the item) 
 *                        - description (of the item)
 *                        - price (decimal number)
 *                        - formattedPrice (string representation of price with pre-pended $ sign)
 */
const targetProductLocator = async function (_location_id, _productDescription) {
  // transform parameters for URL syntax
  var productDescription = _productDescription.trim().replaceAll(/,/g, ' ').replaceAll(/ +/g, ' ').replaceAll(' ', '+');

  // construct the URL for Target product search endpoint
  var apiURL = "https://target-com-store-product-reviews-locations-data.p.rapidapi.com/product/search?store_id=" + _location_id + "&keyword=" + productDescription + "&offset=0&limit=5&rating=0&sort_by=pricelow"; // REST endpoint
  var headers = {
    "method": "GET",
    "headers": {
      "x-rapidapi-host": "target-com-store-product-reviews-locations-data.p.rapidapi.com",
      "x-rapidapi-key": "9813878aa1msh7c70fcdc9bbf8a6p1e1f78jsn1ff70bded748"
    }
  };
  // execute the API call to the URL
  var jsonProductResults = await getAPIData(apiURL, headers);

  // parse out pertinent data content returned and build concise JSON object to return
  var json = { "items": [] };
  for (var i = 0; i < jsonProductResults.products.length; i++) {
    json.items.push({
      "image": jsonProductResults.products[i].item.enrichment.images.primary_image_url,
      "description": jsonProductResults.products[i].item.product_description,
      "price": jsonProductResults.products[i].price.current_retail,
      "formattedPrice": jsonProductResults.products[i].price.formatted_current_price
    });
  }
  return json;
};


/**
 * walmartLocator() - Walmart brick and mortar location search (to find closest location).
 * Pertinent keys to pull from returned JSON
 *    .data.storesBySearchTerm.stores[0].address.postalCode
 *    .data.storesBySearchTerm.stores[0].address.address
 *    .data.storesBySearchTerm.stores[0].address.city
 *    .data.storesBySearchTerm.stores[0].address.state
 * @param {string} _zipCode 
 * @returns {object} JSON object containing
 *                         - address (street address)
 *                         - city (city name)
 *                         - state (abbrev)
 *                         - zipCode (5-digit)
 * 
 * REFERENCE: https://rapidapi.com/apidojo/api/walmart/
 */
const walmartLocator = async function (_zipCode) {
  // construct the URL for  endpoint
  var apiURL = "https://walmart.p.rapidapi.com/stores/list?postalCode=" + _zipCode; // REST endpoint

  var headers = {
    "method": "GET",
    "headers": {
      "x-rapidapi-host": "walmart.p.rapidapi.com",
      "x-rapidapi-key": "9813878aa1msh7c70fcdc9bbf8a6p1e1f78jsn1ff70bded748"
    }
  };

  // execute the API call to the URL
  var jsonWalmartLocation = await getAPIData(apiURL, headers);

  // parse out pertinent data content returned
  var address = jsonWalmartLocation.data.storesBySearchTerm.stores[0].address.address;
  var city = jsonWalmartLocation.data.storesBySearchTerm.stores[0].address.city;
  var state = jsonWalmartLocation.data.storesBySearchTerm.stores[0].address.state;
  var postal_code = jsonWalmartLocation.data.storesBySearchTerm.stores[0].address.postalCode;

  // build a concise JSON object to return
  var json = {
    "address": address,
    "city": city,
    "state": state,
    "zipCode": postal_code
  };
  return json;
};


/**
 * walmartProductLocator() - Walmart product search
 * Pertinent keys to pull from returned JSON
 *    .data.search.searchResult.itemStacks[0].items[0].name (descriptive name of item) 
 *    .data.search.searchResult.itemStacks[0].items[0].imageInfo.thumbnailUrl (jpeg URL) 
 *    .data.search.searchResult.itemStacks[0].items[0].priceInfo.currentPrice.price or priceString
 * 
 * @param {string} _productDescription
 * @returns {object} JSON object containing a list of items...each containing an
 *                        - image (thumbnail image of the item) 
 *                        - description (of the item)
 *                        - price (decimal number)
 *                        - formattedPrice (string representation of price with pre-pended $ sign)
 */
const walmartProductLocator = async function (_productDescription) {
  // transform parameters for URL syntax
  var productDescription = _productDescription.replaceAll(/,/g, ' ').replaceAll(/ +/g, ' ').replaceAll(' ', '+');

  // construct the URL for Walmart product search endpoint
  var apiURL = "https://walmart.p.rapidapi.com/products/v2/list?query=" + productDescription + "&sort=price_low";  // REST endpoint
  var headers = {
    "method": "GET",
    "headers": {
      "x-rapidapi-host": "walmart.p.rapidapi.com",
      "x-rapidapi-key": "9813878aa1msh7c70fcdc9bbf8a6p1e1f78jsn1ff70bded748"
    }
  };

  // execute the API call to the URL
  var jsonProductResults = await getAPIData(apiURL, headers);

  // parse out pertinent data content returned and build concise JSON object to return
  var limit = 5; // imposed limit on items returned
  var json = { "items": [] };
  for (var i = 0; i < jsonProductResults.data.search.searchResult.itemStacks[0].items.length; i++) {
    if (i === limit) {
      break;
    }
    json.items.push({
      "image": jsonProductResults.data.search.searchResult.itemStacks[0].items[i].imageInfo.thumbnailUrl,
      "description": jsonProductResults.data.search.searchResult.itemStacks[0].items[i].name,
      "price": jsonProductResults.data.search.searchResult.itemStacks[0].items[i].priceInfo.currentPrice.price,
      "foramattedPrice": jsonProductResults.data.search.searchResult.itemStacks[0].items[i].priceInfo.currentPrice.priceString
    });
  }
  return json;
};
