let NORMALIZED_STAT_CACHE = {};

class GABOItem {

    constructor(instance, itemData, location) {

        this.name = itemData.name;
        this.statName = this.getItemStatName(instance, itemData);
        this.statID = this.getItemStatID(instance, itemData);
        this.hands = this.getItemHandedness(itemData);
        this.type = this.getItemType(itemData);
        this.subType = this.getItemSubType(itemData);
        this.rarity = this.getItemRarity(itemData);
        this.weight = itemData.access(['details', 'weight_class'], '');
        this.selectableStats = this.getSelectableStats(instance, itemData);
        this.skin = instance.access(['skin'], '');
        this.skinLink = this.skin !== '' ? SKIN_DATA.access([this.skin, 'icon'], '') : '';
        this.icon = itemData.access(['icon'], '');
        this.location = location.replace("%%ITEM%%", `<span class="rarity-${this.rarity.toLowerCase()}">${this.name}</span>`);

    }

    getItemStatName(instance, item) {

        if (instance.stats !== undefined) {
            return STAT_LOOKUP[instance.stats.id];
        }

        if (item.details.infix_upgrade !== undefined) {
            return STAT_LOOKUP[item.details.infix_upgrade.id];
        }

        ITEM_STAT_LOOKUP[this.name] = item.access(["details", "stat_choices"], []);

        return "unselected";

    }

    getItemStatID(instance, item) {

        if (instance.stats !== undefined) {
            return instance.stats.id;
        }

        if (item.details.infix_upgrade !== undefined) {
            return item.details.infix_upgrade.id;
        }

        return undefined;
    }

    setStatName(stat) {
        this.statName = stat;
    }

    setSubType(subType) {
        this.subType = subType;
    }

    getItemHandedness(itemData) {

        if (this.getItemType(itemData) === 'Weapon') {

            let twoHanded = Utility.isTwoHanded(this.getItemSubType(itemData));

            return twoHanded ? "2h" : "1h";
        }

        return "";
    }

    getItemType(itemData) {
        return itemData.type;
    }

    getItemSubType(itemData) {
        return itemData.details.type;
    }

    getItemRarity(itemData) {
        return itemData.rarity;
    }

    setRarity(rarity) {
        this.rarity = rarity;
    }

    getSelectableStats(instance, itemData) {

        if (this.getItemType(itemData) === "Container") {

            return this.getContainerStats(itemData);
        }

        return undefined;

    }

    getContainerStats(container) {

        if (container.name.indexOf("Assaulter's") > -1) {
            return [
                "Assassin's", "Berserker's", "Cavalier's", "Celestial", "Commander's", "Crusader",
                "Diviner's", "Grieving", "Harrier's", "Knight's", "Marauder", "Marshal's", "Rampager's",
                "Sinister", "Soldier's", "Valkyrie", "Vigilant", "Viper's", "Wanderer's", "Zealot's"
            ];
        }

        if (container.name.indexOf("Defender's") > -1) {
            return [
                "Cavalier's", "Celestial", "Crusader", "Dire", "Giver's", "Harrier's", "Knight's",
                "Minstrel's", "Nomad's", "Plaguedoctor's", "Sentinel's", "Settler's", "Shaman's", "Soldier's",
                "Trailblazer's", "Vigilant", "Wanderer's"
            ];
        }

        if (container.name.indexOf("Healer's") > -1) {
            return [
                "Bringer's", "Carrion", "Celestial", "Dire", "Grieving", "Plaguedoctor's", "Rabid", "Seraph",
                "Shaman's", "Sinister", "Trailblazer's", "Viper's"
            ];
        }

        if (container.name.indexOf("Malicious") > -1) {
            return [
                "Apothecary's", "Celestial", "Cleric's", "Diviner's", "Giver's", "Harrier's", "Magi's",
                "Marshal's", "Minstrel's", "Plaguedoctor's", "Seraph"
            ];
        }

        if (container.name.indexOf("Regurgitated") > -1) {
            return [
                "Carrion", "Knight's", "Zealot's"
            ];

        }

        return [container.name];

    }
}