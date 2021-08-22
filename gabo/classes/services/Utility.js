let RARITIES = ["junk", "basic", "fine", "masterwork", "rare", "exotic", "ascended", "legendary"];
let SLOTS = [
    "Helm", "Shoulders", "Coat", "Gloves", "Leggings", "Boots", "WeaponA1", "WeaponA2", "WeaponB1", "WeaponB2",
    "Backpack", "Accessory1", "Accessory2", "Amulet", "Ring1", "Ring2", "HelmAquatic", "WeaponAquaticA", "WeaponAquaticB"
];

let WEAPON_TYPES = [
    'Axe', 'Dagger', 'Mace', 'Pistol', 'Sword',
    'Scepter',
    'Focus', 'Shield', 'Torch', 'Warhorn',
    'Greatsword', 'Hammer', 'Longbow', 'Rifle', 'ShortBow', 'Staff',
    'Harpoon', 'Speargun', 'Trident'
];

let WEIGHTS = {
    "Elementalist": "Light",
    "Engineer": "Medium",
    "Guardian": "Heavy",
    "Mesmer": "Light",
    "Necromancer": "Light",
    "Ranger": "Medium",
    "Revenant": "Heavy",
    "Thief": "Medium",
    "Warrior": "Heavy"
};

let PROFESSION_ICONS = {
    "Elementalist": "https://wiki.guildwars2.com/images/a/aa/Elementalist_tango_icon_20px.png",
    "Engineer": "https://wiki.guildwars2.com/images/2/27/Engineer_tango_icon_20px.png",
    "Guardian": "https://wiki.guildwars2.com/images/8/8c/Guardian_tango_icon_20px.png",
    "Mesmer": "https://wiki.guildwars2.com/images/6/60/Mesmer_tango_icon_20px.png",
    "Necromancer": "https://wiki.guildwars2.com/images/4/43/Necromancer_tango_icon_20px.png",
    "Ranger": "https://wiki.guildwars2.com/images/4/43/Ranger_tango_icon_20px.png",
    "Revenant": "https://wiki.guildwars2.com/images/b/b5/Revenant_tango_icon_20px.png",
    "Thief": "https://wiki.guildwars2.com/images/7/7a/Thief_tango_icon_20px.png",
    "Warrior": "https://wiki.guildwars2.com/images/4/43/Warrior_tango_icon_20px.png"
};

let PROFESSION_ICONS_LARGE = {
    "Elementalist": "https://wiki.guildwars2.com/images/a/a2/Elementalist_icon.png",
    "Engineer": "https://wiki.guildwars2.com/images/4/41/Engineer_icon.png",
    "Guardian": "https://wiki.guildwars2.com/images/c/cc/Guardian_icon.png",
    "Mesmer": "https://wiki.guildwars2.com/images/3/3a/Mesmer_icon.png",
    "Necromancer": "https://wiki.guildwars2.com/images/6/62/Necromancer_icon.png",
    "Ranger": "https://wiki.guildwars2.com/images/9/9c/Ranger_icon.png",
    "Revenant": "https://wiki.guildwars2.com/images/8/89/Revenant_icon.png",
    "Thief": "https://wiki.guildwars2.com/images/d/d8/Thief_icon.png",
    "Warrior": "https://wiki.guildwars2.com/images/c/c8/Warrior_icon.png"
};

class Utility {

    static rarityIsLessThan(thisRarity, thatRarity) {
        return RARITIES.indexOf(thisRarity.toLowerCase()) < RARITIES.indexOf(thatRarity.toLowerCase());
    }

    static rarityIsGreaterThan(thisRarity, thatRarity) {
        return RARITIES.indexOf(thisRarity.toLowerCase()) > RARITIES.indexOf(thatRarity.toLowerCase());
    }

    static isTwoHanded(itemType) {
        return ['Greatsword', 'Hammer', 'Longbow', 'Rifle', 'Shortbow', 'Staff'].indexOf(itemType) > -1;
    }

    static isOffhand(itemType) {
        return ['Focus', 'Shield', 'Torch', 'Warhorn'].indexOf(itemType) > -1;
    }

    static isMainhand(itemType) {
        return itemType === 'Scepter';
    }

    //Sometimes we play fast and loose with possessives (i.e. Berserker vs Berserker's)
    static statsAreEquivalent(first, second) {

        if (!first || !second) {
            return false;
        }

        return first === second || first.indexOf(second) > -1 || second.indexOf(first) > -1;

    }

}
