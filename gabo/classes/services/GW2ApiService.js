//Response from Characters Endpoint
let ALL_CHARACTER_DATA = {};
let CHARACTER = {};

//Response from Bank Endpoint
let BANK_DATA = {};

//Unique items from Item Endpoint
let ITEM_DATA = {};

//Unique skins from Skin Endpoint
let SKIN_DATA = {};

//Response from Stats Endpoint
let STAT_DATA = {};

//Organize Stats into lookup
let STAT_LOOKUP = {};
let STAT_LOOKUP_BY_NAME = {};
let ALL_STATS = [];

//Response from Stats Endpoint for all IDs
let STAT_IDS = {};

//Legendary Armor information
let LEGENDARY_ARMORY = [];

//Equipment Armory
let EQUIPMENT_ARMORY = {};

let ITEM_TYPES_OF_INTEREST = {
    "Weapon": true,
    "Back": true,
    "Trinket": true,
    "UpgradeComponent": true,
    "Armor": true,
    "Container": true
};

let API_LINK = 'https://api.guildwars2.com/v2/';

class GW2ApiService {

    constructor(apiKey) {

        this.API_KEY = apiKey;

    }

    static displayUnauthorized() {
        clearLoading();
        $("#errorContainer").removeClass('hidden');
    }

    //Get character data from GW2 Api
    fetchCharacters() {

        return new Promise((resolve, reject) => {

            $.ajax({
                url: API_LINK + 'characters?ids=all&access_token=' + this.API_KEY,
                success: function(response) {
                    ALL_CHARACTER_DATA = response;

                    resolve();
                },
                error: function (xhr) {
                    if(xhr.status == 403) {
                        GW2ApiService.displayUnauthorized();
                    }
                }
            });

        });
    }

    static buildStatLookup() {

        return new Promise((resolve, reject) => {

            this.fetchStatIDs().then(() => {
                return this.fetchStats();
            }).then(() => {
                resolve();
            });

        });


    }

    static fetchStatIDs() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: API_LINK + 'itemstats',
                success: function(response) {

                    STAT_IDS = response;
                    resolve();
                }
            });
        });
    }

    static fetchStats() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: API_LINK + 'itemstats?ids='+STAT_IDS.join(","),
                success: function(response) {

                    STAT_DATA = response;

                    STAT_DATA.forEach((stat) => {
                        STAT_LOOKUP[stat.id] = stat.name;

                        if (stat.name) {
                            STAT_LOOKUP_BY_NAME[stat.name] = stat;
                            ALL_STATS = Object.keys(STAT_LOOKUP_BY_NAME).sort();
                        }
                    });

                    resolve();

                }
            });
        });
    }

    fetchBank() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: API_LINK + 'account/bank?access_token=' + this.API_KEY,
                success: function (response) {

                    BANK_DATA = response;
                    resolve();

                }
            });
        });

    };

    fetchEquipmentArmories() {

        let equipmentArmories = [];

        ALL_CHARACTER_DATA.forEach((character) => {

            equipmentArmories.push(this.fetchEquipmentArmory(character.name));

        });

        return new Promise((resolve, reject) => {

            $.when(...equipmentArmories).done(() => {

                resolve();

            });

        });

    }

    fetchEquipmentArmory(character) {

        return new Promise((resolve, reject) => {

            $.ajax({
                url: API_LINK + `characters/${character}/equipmenttabs?tabs=all&access_token=${this.API_KEY}`,
                success: function (response) {

                    let armory = [];

                    response.forEach((tab) => {

                        if (tab.equipment === undefined) {
                            return;
                        }

                        tab.equipment.forEach((stashed) => {

                            //We only care about Armory
                            if (stashed.location === "Equipped") {
                                return;
                            }

                            if (stashed.location === "Armory") {
                                stashed.tab = tab.tab;
                                stashed.tabName = tab.name;
                                armory.push(stashed);
                            }

                        })

                    });

                    EQUIPMENT_ARMORY[character] = armory;
                    resolve();

                },
                error: function (xhr) {
                    if(xhr.status == 403) {
                        GW2ApiService.displayUnauthorized();
                    }
                }
            });
        });


    }

    fetchLegendaryArmory() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: API_LINK + 'account/legendaryarmory?access_token=' + this.API_KEY,
                success: function (response) {

                    LEGENDARY_ARMORY = response;
                    resolve();

                }
            });
        });

    };

    //Get item data for relevant equipment slots
    static fetchItems(ids) {

        let itemAjaxes = [];

        let chunks = ids.chunk(50);

        chunks.forEach(function(id, idx){

            itemAjaxes.push($.ajax({
                url: API_LINK + 'items?ids='+chunks[idx].join(',')+'&lang=en',
                success: function(response) {

                    response.forEach(function(item){
                        if (ITEM_TYPES_OF_INTEREST[item.type] !== undefined) {

                            if (item.type === "Container" && item.rarity !== "Ascended") {
                                return;
                            }

                            ITEM_DATA[item.id] = item;
                        }
                    });

                }
            }));

        });

        // Return the Promise so caller can't change the Deferred
        return itemAjaxes

    }

    //Get skin data for relevant equipment slots
    static fetchSkins(ids) {

        let itemAjaxes = [];

        let chunks = ids.chunk(50);

        chunks.forEach(function(id, idx){

            itemAjaxes.push($.ajax({
                url: API_LINK + 'skins?ids='+chunks[idx].join(',')+'&lang=en',
                success: function(response) {

                    response.forEach(function(skin){

                        SKIN_DATA[skin.id] = skin;

                    });

                }
            }));

        });

        return itemAjaxes

    }

    static fetchAccount(apiKey) {

        return new Promise((resolve, reject) => {

            let service = new GW2ApiService(apiKey);

            $.when(service.fetchCharacters(), service.fetchBank(), GW2ApiService.fetchStatIDs(), service.fetchLegendaryArmory()).done(function(characters, bank, statIDs) {

                service.fetchEquipmentArmories().then(() => {

                    //Setup items
                    let uniqueItems = GW2ApiService.buildUniqueItemLookup();
                    let uniqueSkins = GW2ApiService.buildUniqueSkinLookup();

                    $.when(...GW2ApiService.fetchItems(Object.keys(uniqueItems)), ...GW2ApiService.fetchSkins(Object.keys(uniqueSkins)), GW2ApiService.fetchStats()).done(function() {
                        resolve();
                    });

                });

            });

        });

    }


    static buildUniqueItemLookup() {

        let items = {};

        ALL_CHARACTER_DATA.forEach(function(character){

            //Items equipped to character
            items = GW2ApiService.addUniqueCharacterEquipment(character, items);

            //Items in all inventories
            items = GW2ApiService.addUniqueCharacterInventory(character, items);

            //Items in all armories
            items = GW2ApiService.addUniqueCharacterArmory(character.name, items);

        });

        //Items in the bank
        items = GW2ApiService.addUniqueBankItems(items);

        //Items from Legendary Armory
        items = GW2ApiService.addLegendaryArmoryItems(items);

        return items;

    }

    static buildUniqueSkinLookup() {
        let skins = {};

        ALL_CHARACTER_DATA.forEach(function(character){

            //Items equipped to character
            skins = GW2ApiService.addUniqueCharacterEquipmentSkins(character, skins);

            //Items in all inventories
            skins = GW2ApiService.addUniqueCharacterInventorySkins(character, skins);

            //Items in all armories
            skins = GW2ApiService.addUniqueCharacterArmorySkins(character.name, skins);

        });

        //Items in the bank
        skins = GW2ApiService.addUniqueBankItemsSkins(skins);

        return skins;
    }

    static addUniqueCharacterEquipment(character, items) {

        character.equipment.forEach(function(equipped){

            if (!equipped) {
                return;
            }

            items[equipped.id] = true;

            if (equipped.skin !== undefined) {
                items[equipped.skin] = true;
            }

        });

        return items;

    }

    static addUniqueCharacterArmory(character, items) {

        EQUIPMENT_ARMORY[character].forEach(function(stashed){

            if (!stashed) {
                return;
            }

            items[stashed.id] = true;

        });

        return items;

    }

    static addUniqueCharacterArmorySkins(character, skins) {

        EQUIPMENT_ARMORY[character].forEach(function(stashed){

            if (!stashed) {
                return;
            }

            if (stashed.skin !== undefined) {
                skins[stashed.skin] = true;
            }

        });

        return skins;
    }

    static addUniqueCharacterInventory(character, items) {

        character.bags.forEach(function(bag){

            if (!bag) {
                return;
            }

            bag.inventory.forEach(function(item){

                if(!item) {
                    return;
                }

                items[item.id] = true;

                if (item.skin !== undefined) {
                    items[item.skin] = true;
                }

            });

        });

        return items;

    }

    static addUniqueBankItems(items) {

        BANK_DATA.forEach(function(item){

            if (!item) {
                return;
            }

            items[item.id] = true;

            if (item.skin !== undefined) {
                items[item.skin] = true;
            }

        });

        return items;
    }

    static addLegendaryArmoryItems(items) {

        LEGENDARY_ARMORY.forEach((equipment) => {
            items[equipment.id] = true;
        });

        return items;

    }

    static addUniqueCharacterEquipmentSkins(character, skins) {

        character.equipment.forEach(function(equipped){

            if (!equipped) {
                return;
            }

            if (equipped.skin !== undefined) {
                skins[equipped.skin] = true;
            }

        });

        return skins;

    }

    static addUniqueCharacterInventorySkins(character, skins) {

        character.bags.forEach(function(bag){

            if (!bag) {
                return;
            }

            bag.inventory.forEach(function(item){

                if(!item) {
                    return;
                }

                if (item.skin !== undefined) {
                    skins[item.skin] = true;
                }

            });

        });

        return skins;

    }

    static addUniqueBankItemsSkins(skins) {

        BANK_DATA.forEach(function(item){

            if (!item) {
                return;
            }

            if (item.skin !== undefined) {
                skins[item.skin] = true;
            }

        });

        return skins;
    }



}