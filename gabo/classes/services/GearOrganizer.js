let GEAR_LOOKUP = {}; //All gear across account
let CONTAINER_STAT_LOOKUP = {}; //Containers and their stat listings
let ITEM_STAT_LOOKUP = {}; //Unselected stat items and their stat listings

class GearOrganizer {

    /**
     * Organizes all gear across account into lookups for use with search
     */
    static organizeGear() {

        //Attaches a GABOItem object to every item that is not an upgrade component
        ALL_CHARACTER_DATA.forEach((character) => {

            character.equipment.forEach((equipped) => {

                if (!equipped) {
                    return;
                }

                if (ITEM_DATA[equipped.id] === undefined) {
                    return;
                }

                let item = ITEM_DATA[equipped.id];

                if (item.type === "UpgradeComponent") {
                    return;
                }

                item.gaboItem = new GABOItem(equipped, item, `${character.name} is equipped with %%ITEM%%`);

                GEAR_LOOKUP.bucket(GEAR_LOOKUP, [item.gaboItem.type, item.gaboItem.subType, item.gaboItem.rarity, item.gaboItem.statName], item.gaboItem);

            });

            character.bags.forEach((bag) => {

                if (!bag) {
                    return;
                }

                bag.inventory.forEach((held) => {

                    if (!held) {
                        return;
                    }

                    if (ITEM_DATA[held.id] === undefined) {
                        return;
                    }

                    let item = ITEM_DATA[held.id];

                    if (item.type === "UpgradeComponent") {
                        return;
                    }

                    item.gaboItem = new GABOItem(held, item, `${character.name} has %%ITEM%% in their inventory`);

                    if (item.type === "Container") {
                        this.addContainerToLookup(item);
                        return;
                    }

                    GEAR_LOOKUP.bucket(GEAR_LOOKUP, [item.gaboItem.type, item.gaboItem.subType, item.gaboItem.rarity, item.gaboItem.statName], item.gaboItem);

                });

            });


        });

        BANK_DATA.forEach((stored) => {
            if (!stored) {
                return;
            }

            if (ITEM_DATA[stored.id] === undefined) {
                return;
            }

            let item = ITEM_DATA[stored.id];

            if (item.type === "UpgradeComponent") {
                return;
            }

            item.gaboItem = new GABOItem(stored, item, `You have %%ITEM%% in your bank`);

            if (item.type === "Container") {
                this.addContainerToLookup(item);
                return;
            }

            GEAR_LOOKUP.bucket(GEAR_LOOKUP, [item.gaboItem.type, item.gaboItem.subType, item.gaboItem.rarity, item.gaboItem.statName], item.gaboItem);
        });

        Object.keys(EQUIPMENT_ARMORY).forEach((character) => {

            EQUIPMENT_ARMORY[character].forEach((stashed) => {

                if (!stashed) {
                    return;
                }

                if (ITEM_DATA[stashed.id] === undefined) {
                    return;
                }

                let item = ITEM_DATA[stashed.id];

                item.gaboItem = new GABOItem(stashed, item, `${character} has %%ITEM%% stored in Equipment tab ${stashed.tab} named ${stashed.tabName}`);

                GEAR_LOOKUP.bucket(GEAR_LOOKUP, [item.gaboItem.type, item.gaboItem.subType, item.gaboItem.rarity, item.gaboItem.statName], item.gaboItem);

            });

        })

        LEGENDARY_ARMORY.forEach((stashed) => {

            if (stashed["count"] === 0) {
                return;
            }

            for (let i = 0; i < stashed["count"]; i++) {

                let item = ITEM_DATA[stashed.id];

                let copy = stashed["count"] > 1 ? "copies" : "copy";
                item.gaboItem = new GABOItem(item, item, `You have ${stashed["count"]} ${copy} of %%ITEM%% in your legendary armory`);

                GEAR_LOOKUP.bucket(GEAR_LOOKUP, [item.gaboItem.type, item.gaboItem.subType, item.gaboItem.rarity, item.gaboItem.statName], item.gaboItem);
            }

        });

    }

    /**
     * Find item equivalent in gear lookup
     * @param item
     * @returns {*[]}
     */
    static findEquivalent(item) {

        let gear = GEAR_LOOKUP.access([item.type, item.subType, item.rarity, item.statName], []);
        let unselected = GEAR_LOOKUP.access([item.type, item.subType, item.rarity, "unselected"],[]);

        let equivalents = [];

        gear.forEach((piece) => {

            if (GearOrganizer.itemIsCorrectWeight(piece)) {
                equivalents.push(piece);
            }
        });

        unselected.forEach((piece) => {

            if (GearOrganizer.itemIsCorrectWeight(piece) && GearOrganizer.itemCanBeStat(piece, item.statID)) {
                equivalents.push(piece);
            }

        });

        let matchingContainers = GearOrganizer.matchingContainers(item, item.rarity);
        Object.keys(matchingContainers).forEach((stats) => {

            if (stats === "Any") {
                equivalents = equivalents.concat(matchingContainers[stats]);
            }

            if (stats === "Multiple") {

                matchingContainers[stats].forEach((container) => {

                    if (CONTAINER_STAT_LOOKUP.access([container.name], []).indexOf(item.statName) > -1) {
                        equivalents = equivalents.concat(container);
                    }

                });

            }

        });

        return equivalents;

    }

    /**
     * Find better item in gear lookup
     * @param item
     * @returns {*[]}
     */
    static findSuperior(item) {

        let superiors = [];

        RARITIES.forEach((rarity) => {

            if (Utility.rarityIsGreaterThan(rarity, item.rarity)) {
                let clonedItem = JSON.parse(JSON.stringify(item));
                clonedItem.rarity = rarity.capitalize();
                //Serialize as JSON and back to clone item, avoids modifying original item
                superiors = superiors.concat(GearOrganizer.findEquivalent(clonedItem));
            }

        });

        return superiors;

    }

    /**
     * Find convertable item in gear lookup (weapons and armor only)
     * @param item
     * @returns {*[]}
     */
    static findConvertable(item) {

        if (["Weapon", "Armor"].indexOf(item.type) < 0) {
            return [];
        }

        let allStatedItems = GEAR_LOOKUP.access([item.type, item.subType, item.rarity], []);

        let convertables = [];
        Object.keys(allStatedItems).forEach((statName) => {

            //We only want stats not matching
            if (statName == item.statName) {
                return;
            }

            let statedItems = allStatedItems[statName];

            statedItems.forEach((piece) => {
                if (GearOrganizer.itemIsCorrectWeight(piece) && Utility.rarityIsGreaterThan(piece.rarity, 'exotic')) {

                    //TODO: Can selectable stat items be converted?
                    if (piece.statName !== "unselected") {
                        convertables.push(piece);
                    }
                }
            });

        });

        let matchingContainers = GearOrganizer.matchingContainers(item, item.rarity);

        Object.keys(matchingContainers).forEach((stats) => {

            if (stats === "Any") {
                convertables = convertables.concat(matchingContainers[stats]);
            }

            if (stats === "Multiple") {

                matchingContainers[stats].forEach((container) => {
                    convertables = convertables.concat(container);
                });

            }

        });

        return convertables;

    }

    /**
     * Find inferior item in gear lookup
     * @param item
     * @returns {*[]}
     */
    static findInferior(item) {

        let allRarityItems = GEAR_LOOKUP.access([item.type, item.subType], []);

        let inferiors = [];

        Object.keys(allRarityItems).forEach((rarity) => {

            if (Utility.rarityIsLessThan(rarity, item.rarity)) {

                if (allRarityItems[rarity][item.statName] === undefined) {
                    return;
                }

                allRarityItems[rarity][item.statName].forEach((piece) => {
                    if (GearOrganizer.itemIsCorrectWeight(piece)) {
                        inferiors.push(piece);
                    }
                });

                allRarityItems.access([rarity, "unselected"], []).forEach((piece) => {

                    if (GearOrganizer.itemCanBeStat(piece, item.statID)) {
                        inferiors.push(piece);
                    }

                });

                let matchingContainers = GearOrganizer.matchingContainers(item, rarity);
                Object.keys(matchingContainers).forEach((stats) => {

                    if (stats === "Any") {
                        inferiors.concat(matchingContainers[stats]);
                    }

                    if (stats === "Multiple") {

                        matchingContainers[stats].forEach((container) => {
                            inferiors.concat(container);
                        });

                    }

                });

            }

        });

        return inferiors;

    }

    /**
     * Finds containers for item subtype with same rarity
     * @param item
     * @param rarity
     * @returns {*}
     */
    static matchingContainers(item, rarity) {

        let matchingContainers = GEAR_LOOKUP.access(["Container", item.subType, rarity], []);

        if (matchingContainers["Multiple"] !== undefined) {
            matchingContainers["Multiple"].concat(GEAR_LOOKUP.access(["Container", item.type, rarity], []));
        }
        if (matchingContainers["Any"] !== undefined) {
            matchingContainers["Any"].concat(GEAR_LOOKUP.access(["Container", item.type, rarity], []));
        }

        return matchingContainers;
    }

    /**
     * Checks that item matches character's weight class where applicable
     * @param item
     * @returns {boolean}
     */
    static itemIsCorrectWeight(item) {

        if (item.type !== "Armor") {
            return true;
        }

        return item.weight === CURRENT_CHARACTER.weight;

    }

    /**
     * Attempt to add chests to lookups where possible
     * @param container
     */
    static addContainerToLookup(container) {

        //TODO: There are definitely unsupported chests. Qadim's Peerless Cache comes to mind for only having two weapon subtypes
        let chestType = "";

        chestType = container.name.indexOf("Weapon") > -1 ? "Weapon" : chestType;
        chestType = container.name.indexOf("Armor") > -1 ? "Armor" : chestType;
        chestType = container.name.indexOf("Hoard") > -1 ? "Weapon" : chestType;
        chestType = container.name.indexOf("Aurene") > -1 ? "Weapon" : chestType;
        chestType = container.name.indexOf("Kaiser") > -1 ? "Weapon" : chestType;
        chestType = container.name.indexOf("Helms") > -1 ? "Helm" : chestType;
        chestType = container.name.indexOf("Headgear") > -1 ? "Helm" : chestType;
        chestType = container.name.indexOf("Shoulders") > -1 ? "Shoulders" : chestType;
        chestType = container.name.indexOf("Coats") > -1 ? "Coat" : chestType;
        chestType = container.name.indexOf("Gloves") > -1 ? "Gloves" : chestType;
        chestType = container.name.indexOf("Leggings") > -1 ? "Leggings" : chestType;
        chestType = container.name.indexOf("Boots") > -1 ? "Boots" : chestType;

        if (["Ascended Armor Chest"].indexOf(container.name) > -1) {

            GEAR_LOOKUP.bucket(GEAR_LOOKUP, [container.gaboItem.type, "Armor", chestType, container.gaboItem.rarity, "Any"], container.gaboItem);
            return;
        }

        if (["Ascended Weapon Chest", "Kaiser Snake Weapon Box"].indexOf(container.name) > -1) {

            GEAR_LOOKUP.bucket(GEAR_LOOKUP, [container.gaboItem.type, "Weapon", container.gaboItem.rarity, "Any"], container.gaboItem);
            return;

        }

        if (container.description === undefined) {
            return;
        }

        GEAR_LOOKUP.bucket(GEAR_LOOKUP, [container.gaboItem.type, chestType, container.gaboItem.rarity, "Multiple"], container.gaboItem);

        let assaulters = [
            "Assassin's", "Berserker's", "Cavalier's", "Celestial", "Commander's", "Crusader",
            "Diviner's", "Grieving", "Harrier's", "Knight's", "Marauder", "Marshal's", "Rampager's",
            "Sinister", "Soldier's", "Valkyrie", "Vigilant", "Viper's", "Wanderer's", "Zealot's"
        ];
        let defenders = [
            "Cavalier's", "Celestial", "Crusader", "Dire", "Giver's", "Harrier's", "Knight's",
            "Minstrel's", "Nomad's", "Plaguedoctor's", "Sentinel's", "Settler's", "Shaman's", "Soldier's",
            "Trailblazer's", "Vigilant", "Wanderer's"
        ];
        let malicious = [
            "Apothecary's", "Celestial", "Cleric's", "Diviner's", "Giver's", "Harrier's", "Magi's",
            "Marshal's", "Minstrel's", "Plaguedoctor's", "Seraph"
        ];
        let healers = [
            "Bringer's", "Carrion", "Celestial", "Dire", "Grieving", "Plaguedoctor's", "Rabid", "Seraph",
            "Shaman's", "Sinister", "Trailblazer's", "Viper's"
        ];

        let raidStats = assaulters.concat(defenders, malicious, healers);

        //Put the container into container lookup to verify that a match exists when "Multiple" shows up in GEAR_LOOKUP
        if (container.gaboItem.name.indexOf("Assaulter's") > -1) {
            CONTAINER_STAT_LOOKUP[container.gaboItem.name] = assaulters;

            return;
        }

        if (container.gaboItem.name.indexOf("Defender's") > -1) {
            CONTAINER_STAT_LOOKUP[container.gaboItem.name] = defenders;

            return;
        }

        if (container.gaboItem.name.indexOf("Healer's") > -1) {
            CONTAINER_STAT_LOOKUP[container.gaboItem.name] = healers;

            return;
        }

        if (container.gaboItem.name.indexOf("Malicious") > -1) {
            CONTAINER_STAT_LOOKUP[container.gaboItem.name] = malicious;

            return;
        }

        if (container.gaboItem.name.indexOf("Regurgitated") > -1) {
            CONTAINER_STAT_LOOKUP[container.gaboItem.name] = [
                "Carrion", "Knight's", "Zealot's"
            ];

            return;

        }

        GearOrganizer.setContainerStatLookupRecord(container, "Angchu", ["Cavalier's"]);
        GearOrganizer.setContainerStatLookupRecord(container, "Ahamid", ["Soldier's"]);
        GearOrganizer.setContainerStatLookupRecord(container, "Beigarth", ["Knight's"]);
        GearOrganizer.setContainerStatLookupRecord(container, "Chorben", ["Soldier's"]);
        GearOrganizer.setContainerStatLookupRecord(container, "Coalforge", ["Rampager's"]);
        GearOrganizer.setContainerStatLookupRecord(container, "Ebonmane", ["Apothecary's"]);
        GearOrganizer.setContainerStatLookupRecord(container, "Ferratus", ["Rabid"]);
        GearOrganizer.setContainerStatLookupRecord(container, "Forgemaster", ["Rampager's"]);
        GearOrganizer.setContainerStatLookupRecord(container, "Gobrech", ["Valkyrie"]);
        GearOrganizer.setContainerStatLookupRecord(container, "Grizzlemouth", ["Rabid"]);
        GearOrganizer.setContainerStatLookupRecord(container, "Hronk", ["Magi's"]);
        GearOrganizer.setContainerStatLookupRecord(container, "Keeper", ["Zealot's"]);
        GearOrganizer.setContainerStatLookupRecord(container, "Leftpaw", ["Settler's"]);
        GearOrganizer.setContainerStatLookupRecord(container, "Mathilde", ["Dire"]);
        GearOrganizer.setContainerStatLookupRecord(container, "Morbach", ["Dire"]);
        GearOrganizer.setContainerStatLookupRecord(container, "Occam", ["Carrion"]);
        GearOrganizer.setContainerStatLookupRecord(container, "Saphir", ["Assassin's"]);
        GearOrganizer.setContainerStatLookupRecord(container, "Soros", ["Assassin's"]);
        GearOrganizer.setContainerStatLookupRecord(container, "Stonecleaver", ["Valkyrie"]);
        GearOrganizer.setContainerStatLookupRecord(container, "Tequatl's Hoard", ["Rabid"]);
        GearOrganizer.setContainerStatLookupRecord(container, "Tateos", ["Cleric's"]);
        GearOrganizer.setContainerStatLookupRecord(container, "Theodosus", ["Cleric's"]);
        GearOrganizer.setContainerStatLookupRecord(container, "Tonn", ["Sentinel's"]);
        GearOrganizer.setContainerStatLookupRecord(container, "Veldrunner", ["Apothecary's"]);
        GearOrganizer.setContainerStatLookupRecord(container, "Wei Qi", ["Sentinel's"]);
        GearOrganizer.setContainerStatLookupRecord(container, "Wupwup", ["Celestial"]);
        GearOrganizer.setContainerStatLookupRecord(container, "Zintl", ["Shaman's"]);
        GearOrganizer.setContainerStatLookupRecord(container, "Zojja", ["Berserker's"]);

        //Raid Chests
        GearOrganizer.setContainerStatLookupRecord(container, "Value Guardian Boots", raidStats);
        GearOrganizer.setContainerStatLookupRecord(container, "Gorseval Leggings", raidStats);
        GearOrganizer.setContainerStatLookupRecord(container, "Sabetha's Armor", raidStats);
        GearOrganizer.setContainerStatLookupRecord(container, "Slothasor Gloves", raidStats);
        GearOrganizer.setContainerStatLookupRecord(container, "White Mantle Weaponry", raidStats);
        GearOrganizer.setContainerStatLookupRecord(container, "White Mantle Shoulders", raidStats);
        GearOrganizer.setContainerStatLookupRecord(container, "Keep Construct Helms", raidStats);
        GearOrganizer.setContainerStatLookupRecord(container, "White Mantle Armaments", raidStats);
        GearOrganizer.setContainerStatLookupRecord(container, "Gloves of the Obedient", raidStats);
        GearOrganizer.setContainerStatLookupRecord(container, "Dhuum's Headgear", raidStats);
        GearOrganizer.setContainerStatLookupRecord(container, "Dhuum's Shoulders", raidStats);
        GearOrganizer.setContainerStatLookupRecord(container, "Dhuum's Gloves", raidStats);
        GearOrganizer.setContainerStatLookupRecord(container, "Dhuum's Boots", raidStats);
    }

    /**
     * Helper method to set stat lookup if name matches enough
     * @param container
     * @param name
     * @param stats
     */
    static setContainerStatLookupRecord(container, name, stats) {
        if (container.gaboItem.name.indexOf(name) > -1) {
            CONTAINER_STAT_LOOKUP[container.gaboItem.name] = stats;
        }
    }

    static setItemStatLookupRecord(item, stats) {
        ITEM_STAT_LOOKUP[item.name] = stats;
    }

    /**
     * Check if an item can actually be changed to a stat
     * @param item
     * @param statID
     * @returns {boolean}
     */
    static itemCanBeStat(item, statID) {
        return ITEM_STAT_LOOKUP.access([item.name], []).indexOf(statID) > -1;
    }
}