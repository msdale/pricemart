//Global Variables
var shopperAddr = sessionStorage.getItem("shopperAddr");
var targetLocationId = sessionStorage.getItem("targetLocationId");
var itemDesc = sessionStorage.getItem("itemDesc");

var shoppingList = JSON.parse(sessionStorage.getItem("shoppingList"));
if (!shoppingList || !shoppingList.Target || !shoppingList.Walmart) {
  var shoppingList = { "Target": [], "Walmart": [] };
}
sessionStorage.clear();
sessionStorage.setItem("shoppingList", JSON.stringify(shoppingList));


/**
 * removeAllChildNodes() - removes all elements contained in parent element 
 * @param {DOM element} parent 
 */
var removeAllChildNodes = function (parent) {
  if (parent) {
    while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
    }
  }
}


// Address, Distance and Store Location function
/**
 * populateLocationElements() - uses the input address to locate nearest retailer
 *   locations, then posts those locations along with drive-time and mileage to the
 *   web page.
 * @param {text} _inputAddress - shopper/user address 
 * @returns {text} Target location Id - needed to identify the Target retailer location
 *   for production lookup.
 */
var populateLocationElements = async function (_inputAddress) {
  var addrArray = _inputAddress.split(" ");
  var zipCode = addrArray[addrArray.length - 1];

  /*
   * Retailer: Target Data
   */
  var jsonTargetLocation = await targetLocator(zipCode, "20");

  // need for driving distance calculator
  var targetAddr = await jsonTargetLocation.address + ", " + jsonTargetLocation.city + " " + jsonTargetLocation.state + ", " + jsonTargetLocation.zipCode;

  var jsonDrivingDistanceToTarget = await drivingDistance(_inputAddress, targetAddr);

  // HERE"S WHERE YOU POPULATE THE PAGE WITH TARGET DATA
  console.log("READY TO POPULATE ON THE PAGE");
  console.log("TARGET LOCATION");
  console.log(jsonTargetLocation);
  console.log(jsonDrivingDistanceToTarget);
  console.log("*********************************");
  var targetHeaderEl = document.querySelector("#target-info");
  removeAllChildNodes(targetHeaderEl);
  var targetAddressEl = document.createElement("h4");
  targetAddressEl.textContent = "Store Address: " + jsonTargetLocation.address + ", " + jsonTargetLocation.city + " " + jsonTargetLocation.state + ", " + jsonTargetLocation.zipCode;
  targetHeaderEl.appendChild(targetAddressEl);
  var targetMilesEl = document.createElement("p");
  targetMilesEl.textContent = "Distance to Store: " + jsonDrivingDistanceToTarget.distanceInMiles + " Miles";
  targetHeaderEl.appendChild(targetMilesEl);
  var targetAvgDriveTimeEl = document.createElement("p");
  targetAvgDriveTimeEl.textContent = "Average Time: " + jsonDrivingDistanceToTarget.avgTimeInMinutes + " Min";
  targetHeaderEl.appendChild(targetAvgDriveTimeEl);
  var targetTrafficDriveTimeEl = document.createElement("p");
  targetTrafficDriveTimeEl.textContent = "Current Traffic Time: " + jsonDrivingDistanceToTarget.trafficTimeInMinutes + " Min";
  targetHeaderEl.appendChild(targetTrafficDriveTimeEl);

  /*
   * Retailer: Walmart Data
   */
  var jsonWalmartLocation = await walmartLocator(zipCode);

  // need for driving distance calculator
  var walmartAddr = await jsonWalmartLocation.address + ", " + jsonWalmartLocation.city + " " + jsonWalmartLocation.state + ", " + jsonWalmartLocation.zipCode;

  var jsonDrivingDistanceToWalmart = await drivingDistance(_inputAddress, walmartAddr);

  // HERE"S WHERE YOU POPULATE THE PAGE WITH WALMART DATA
  console.log("READY TO POPULATE ON THE PAGE");
  console.log("WALMART LOCATION");
  console.log(jsonWalmartLocation);
  console.log("DRIVE TO WALMART LOCATION");
  console.log(jsonDrivingDistanceToWalmart);
  console.log("*********************************");
  var walmartHeaderEl = document.querySelector("#walmart-info");
  removeAllChildNodes(walmartHeaderEl);
  var walmartAddressEl = document.createElement("h4");
  walmartAddressEl.textContent = "Store Address: " + jsonWalmartLocation.address + ", " + jsonWalmartLocation.city + " " + jsonWalmartLocation.state + ", " + jsonWalmartLocation.zipCode;
  walmartHeaderEl.appendChild(walmartAddressEl);
  var walmartMilesEl = document.createElement("p");
  walmartMilesEl.textContent = "Distance to Store: " + jsonDrivingDistanceToWalmart.distanceInMiles + " Miles";
  walmartHeaderEl.appendChild(walmartMilesEl);
  var walmartAvgDriveTimeEl = document.createElement("p");
  walmartAvgDriveTimeEl.textContent = "Average Time: " + jsonDrivingDistanceToWalmart.avgTimeInMinutes + " Min";
  walmartHeaderEl.appendChild(walmartAvgDriveTimeEl);
  var walmartTrafficDriveTimeEl = document.createElement("p");
  walmartTrafficDriveTimeEl.textContent = "Current Traffic Time: " + jsonDrivingDistanceToWalmart.trafficTimeInMinutes + " Min";
  walmartHeaderEl.appendChild(walmartTrafficDriveTimeEl);

  return jsonTargetLocation.location_id; // need for target item lookup
};


/**
 * populateItemElements() - accepts the Target location Id as well an item description
 *   to facilitate finding and displaying the product item lists available for sale.  Note;
 *   no location id is needed or used for Walmart 
 * @param {*} location_id 
 * @param {*} _itemDesc 
 */
var populateItemElements = async function (location_id, _itemDesc) {
  // Target Data
  var jsonTargetItemList = await targetProductLocator(location_id, _itemDesc);

  var targetItemsList = document.getElementById("target-items");
  // HERE"S WHERE YOU POPULATE THE PAGE WITH TARGET DATA
  console.log("READY TO POPULATE ON THE PAGE");
  console.log("TARGET PRODUCT LIST");
  console.log(jsonTargetItemList);
  console.log("*********************************");
  var targetItemsEl = document.getElementById("target-items");
  removeAllChildNodes(targetItemsEl);
  for (var i = 0; i < jsonTargetItemList.items.length; i++) {
    // image
    var itemEl = document.createElement("li");
    itemEl.innerHTML = '<image src="' + jsonTargetItemList.items[i].image + '" style="width: 30%;" alt="Placeholder image">';

    // description
    var itemDescEl = document.createElement("p");
    itemDescEl.textContent = jsonTargetItemList.items[i].description.title;
    itemEl.appendChild(itemDescEl);

    // price
    var itemPriceEl = document.createElement("h4");
    itemPriceEl.textContent = jsonTargetItemList.items[i].formattedPrice;
    itemEl.appendChild(itemPriceEl);

    // button
    var itemButtonEl = document.createElement("button");
    itemButtonEl.textContent = "Add To Shopping List";
    itemButtonEl.setAttribute("idx", i);
    itemEl.appendChild(itemButtonEl);

    targetItemsEl.appendChild(itemEl);
  }
  console.log(targetItemsEl);


  // Walmart Data
  var jsonWalmartItemList = await walmartProductLocator(_itemDesc);

  var walmartItemsList = document.getElementById("walmart-items");
  // HERE"S WHERE YOU POPULATE THE PAGE WITH WALMART DATA
  console.log("READY TO POPULATE ON THE PAGE");
  console.log("WALMART PRODUCT LIST");
  console.log(jsonWalmartItemList);
  console.log("*********************************");
  var walmartItemsEl = document.getElementById("walmart-items");
  removeAllChildNodes(walmartItemsEl);
  for (var i = 0; i < jsonWalmartItemList.items.length; i++) {
    // image
    var itemEl = document.createElement("li");
    itemEl.innerHTML = '<image src="' + jsonWalmartItemList.items[i].image + '" style="width: 30%;" alt="Placeholder image">';

    // description
    var itemDescEl = document.createElement("p");
    itemDescEl.textContent = jsonWalmartItemList.items[i].description;
    itemEl.appendChild(itemDescEl);

    // price
    var itemPriceEl = document.createElement("h4");
    itemPriceEl.textContent = jsonWalmartItemList.items[i].foramattedPrice;
    itemEl.appendChild(itemPriceEl);

    // button
    var itemButtonEl = document.createElement("button");
    itemButtonEl.textContent = "Add To Shopping List";
    itemButtonEl.setAttribute("idx", i);
    itemEl.appendChild(itemButtonEl);

    walmartItemsEl.appendChild(itemEl);
  }
  console.log(walmartItemsEl);
};


/**
 * resetShopperAddr() - Resets the shopper address when returning from the
 *   shopping list page.
 * resetShopperAddr() - Resets the shopper address from session storage
 *   when returning from the shopping list page. 
 */
var resetShopperAddr = async function () {
  var inputAddrEl = document.getElementById("address-input");
  inputAddrEl.value = shopperAddr;
  var targetLocationId = await populateLocationElements(shopperAddr);
  sessionStorage.setItem("targetLocationId", targetLocationId);
  sessionStorage.setItem("shopperAddr", shopperAddr);
};


/**
 * resetListItems() - Resets the item description and listed items from 
 *   session storage when returning from the shopping list page. 
 */
var resetListItems = async function () {
  var itemDescEl = document.getElementById("item-desc");
  itemDescEl.value = itemDesc;
  sessionStorage.setItem("itemDesc", itemDesc);
  await populateItemElements(targetLocationId, itemDesc);
};


/**
 * resetPage() - Resets the shopper address, item description and item
 *   lists when returning from rthe shopping list page.
 */
var resetPage = async function () {
  if (shopperAddr) {
    await resetShopperAddr();
    if (itemDesc && targetLocationId) {
      await resetListItems();
    }
  }
};


/**
 * getShopperAddr() - An async event listener that is activated when the user
 *   pushes the "Enter" button to enter the shopper address. It is "async" because
 *   it executes the async function populateLocationElements().
 * @param {object} event 
 */
var getShopperAddr = async function (event) {
  // prevent page from refreshing
  event.preventDefault();
  var shopperAddrEl = document.getElementById("address-input");
  shopperAddr = shopperAddrEl.value;
  sessionStorage.setItem("shopperAddr", shopperAddr)
  var targetLocationId = await populateLocationElements(shopperAddr);
  sessionStorage.setItem("targetLocationId", targetLocationId);
};


/**
 * listItems() - An async event listener that is activated when the user pushes
 *   the "Search" button to enter an item description.  It is "async" because
 *   it executes the async function populateItemElements();
 * @param {object} event 
 */
var listItems = async function (event) {
  // prevent page from refreshing
  event.preventDefault();

  var itemDescEl = document.getElementById("item-desc");
  var itemDesc = itemDescEl.value;
  sessionStorage.setItem("itemDesc", itemDesc);
  var targetLocationId = sessionStorage.getItem("targetLocationId");
  await populateItemElements(targetLocationId, itemDesc);
};


/**
 * saveTargetItem() - An event listener that is activated when the user clicks
 *   "Add To Shopping List" button for any listed item.  Presently this function
 *   saves the associated item and it's data to the session object designated for
 *   the shopping list data for the Target retailer location.
 * @param {object} event 
 */
var saveTargetItem = function (event) {
  // prevent page from refreshing
  event.preventDefault();
  var index = event.target.getAttribute("idx");
  var targetItemListEl = document.querySelector("#target-items");
  console.log(targetItemListEl);
  var targetItemsEl = targetItemListEl.getElementsByTagName("li");
  shoppingList = JSON.parse(sessionStorage.getItem("shoppingList"));
  shoppingList.Target.push({ "description": targetItemsEl[index].children[1].textContent, "formattedPrice": targetItemsEl[index].children[2].textContent });
  console.log(shoppingList);
  console.log(targetItemsEl[index].children[1].textContent);
  console.log(targetItemsEl[index].children[2].textContent);
  sessionStorage.setItem("shoppingList", JSON.stringify(shoppingList));
};


/**
 * saveWalmartItem() - An event listener that is activated when the user clicks
 *   "Add To Shopping List" button for any listed item.  Presently this function
 *   saves the associated item and it's data to the session object designated for
 *   the shopping list data for the Walmart retailer location.
 * @param {object} event 
 */
var saveWalmartItem = function (event) {
  // prevent page from refreshing
  event.preventDefault();
  var index = event.target.getAttribute("idx");
  var walmartItemListEl = document.querySelector("#walmart-items");
  console.log(walmartItemListEl);
  var walmartItemsEl = walmartItemListEl.getElementsByTagName("li");
  shoppingList = JSON.parse(sessionStorage.getItem("shoppingList"));
  shoppingList.Walmart.push({ "description": walmartItemsEl[index].children[1].textContent, "formattedPrice": walmartItemsEl[index].children[2].textContent });
  console.log(shoppingList);
  console.log(walmartItemsEl[index].children[1].textContent);
  console.log(walmartItemsEl[index].children[2].textContent);
  sessionStorage.setItem("shoppingList", JSON.stringify(shoppingList));
};


/**
 * viewShoppingList() - This function is deprecated. 
 * @param {object} event 
 */
var viewShoppingList = function (event) {
  // prevent page from refreshing
  event.preventDefault();
  shoppingList = JSON.parse(sessionStorage.getItem("shoppingList"));

  // Target Shopping List
  var targetShoppingListEl = document.getElementById("target-shopping-list");
  removeAllChildNodes(targetShoppingListEl);
  var targetShoppingListTitleEl = document.createElement("p");
  targetShoppingListTitleEl.textContent = "Target Shopping List";
  targetShoppingListEl.appendChild(targetShoppingListTitleEl);
  for (var i = 0; i < shoppingList.Target.length; i++) {
    var itemEl = document.createElement("li");
    itemEl.textContent = shoppingList.Target[i].description + " --- " + shoppingList.Target[i].formattedPrice;
    targetShoppingListEl.appendChild(itemEl);
  }

  // Walmart Shopping List
  var walmartShoppingListEl = document.getElementById("walmart-shopping-list");
  removeAllChildNodes(walmartShoppingListEl);
  var walmartShoppingListTitleEl = document.createElement("p");
  walmartShoppingListTitleEl.textContent = "Walmart Shopping List";
  walmartShoppingListEl.appendChild(walmartShoppingListTitleEl);
  for (var i = 0; i < shoppingList.Walmart.length; i++) {
    var itemEl = document.createElement("li");
    itemEl.textContent = shoppingList.Walmart[i].description + " --- " + shoppingList.Walmart[i].formattedPrice;
    walmartShoppingListEl.appendChild(itemEl);
  }
}

resetPage();
var enterBtnEl = document.getElementById("enter-button");
enterBtnEl.addEventListener("click", getShopperAddr);
var searchBtnEl = document.getElementById("search-button");
searchBtnEl.addEventListener("click", listItems);

var targetItemsEl = document.getElementById("target-items");
targetItemsEl.addEventListener("click", saveTargetItem);
var walmartItemsEl = document.getElementById("walmart-items");
walmartItemsEl.addEventListener("click", saveWalmartItem);
