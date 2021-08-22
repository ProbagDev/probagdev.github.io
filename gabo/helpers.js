//TODO: Change text to say Weapon type not just slot
//TODO: Add input for weapon type that is set automatically when you select a weapon, otherwise hidden
let CURRENT_CHARACTER = {}; //Character selected via Character Menu
let CURRENT_GEAR = {}; //Gear for selected character
let SELECTED_RARITY = 'Ascended'; //Currently selected rarity, default Ascended
let SELECTED_STAT = ''; //Currently selected stat, no default

/**
 * Refresh page
 */
function back() {
    location.reload();
}

/**
 * Show loading spinner
 */
function showLoading() {
    $("#loadingContainer").removeClass('hidden');
}

/**
 * Clear loading spinner
 */
function clearLoading() {
    $("#loadingContainer").addClass('hidden');
}

/**
 * Gathers all the gear and lookups from the user's account and moves to the Character Menu
 */
function checkGear() {

    let apiKey = $("#apiKey").val();

    //Hide API input form
    $("#setup").addClass('hidden');

    showLoading();

    //Get all account data
    GW2ApiService.fetchAccount(apiKey).then(() => {

        localStorage.setItem('apiKey', apiKey);

        //Organize gear from account into lookups
        GearOrganizer.organizeGear();

        //Create character buttons
        buildCharacterMenu();

    });

}

/**
 * Get the Api Key from local storage or input for prepopulating
 * @returns {string|*|jQuery}
 */
function getAPIKey() {

    if (localStorage.getItem('apiKey') === undefined) {
        return $("#apiKey").val();
    } else {
        return localStorage.getItem('apiKey');
    }

}

/**
 * Prepopulate the api key
 */
function fillAPIKey() {
    $("#apiKey").val(getAPIKey());
}

/**
 * Create boxes for selecting which character's gear to focus on
 * Note: In general, this step is only important for searching with respect to item weights (light, medium, heavy)
 */
function buildCharacterMenu() {

    ALL_CHARACTER_DATA.forEach((character) => {

        let characterBox = `
                    <div class="d-flex flex-column character-card align-items-center" onclick="showEquipment('${character.name}')">
                        <img width="75" src="${PROFESSION_ICONS_LARGE[character.profession]}" />
                        <p class="m-0">${character.name}</p>
                    </div>
                `;

        $("#characterSelections").append(characterBox);

    });

    $("#characterMenu").removeClass('hidden');

    clearLoading();
}

/**
 * Displays the character's equipment
 * @param name
 */
function showEquipment(name) {

    ALL_CHARACTER_DATA.forEach((toon, idx) => {

        if (toon.name === name) {
            CURRENT_CHARACTER = ALL_CHARACTER_DATA[idx];
            CURRENT_CHARACTER.weight = WEIGHTS[CURRENT_CHARACTER.profession];

            CURRENT_CHARACTER.equipment.forEach((equipped) => {
                CURRENT_GEAR[equipped.slot] = equipped;
            });
        }

    });

    SLOTS.forEach((slot) => {

        fillSlot(slot);

    });

    $("#results").show();

    $("#characterMenu").addClass('hidden');

}

/**
 * Replaces placeholder gear slots with character's actual gear
 * @param slot
 */
function fillSlot(slot) {

    if (!CURRENT_GEAR[slot]) {
        $(`#${slot}Content`).attr('onclick', `showFilters('${slot}')`);
        return;
    }

    let item = ITEM_DATA[CURRENT_GEAR[slot].id];

    $(`#${slot}Content`).removeClass("rarity-junk").empty().append(`
                <img id="${slot}" alt="${slot}" class="item-img img-fluid" src="${item.icon}"/>
            `).addClass(`rarity-${item.rarity.toLowerCase()}`).attr('onclick', `showFilters('${slot}')`);

}

/**
 * Displays the box containing filters for the search
 * @param slot
 */
function showFilters(slot) {

    let readableSlot = humanReadableSlot(slot);

    $('#toot').empty();

    //Search for (a Rarity Stat Slot)
    $('#toot').append(`<p id="searchText">Searching for <span id="raritySearch" class="titled rarity-${SELECTED_RARITY.toLowerCase()}">${SELECTED_RARITY}</span> <span id="statName">${SELECTED_STAT}</span> <span id="type">${readableSlot}</span>...</p>`);

    //Rarity Slider
    $('#toot').append(getRarityRadios());
    $(`#rr-${SELECTED_RARITY.toLowerCase()}`).attr('checked', true);
    $('input[name^="rarity-radio"]').on('change', () => {

        SELECTED_RARITY = $('input[name^="rarity-radio"]:checked').val();

        $('#raritySearch').removeClass();
        $('#raritySearch').addClass(`rarity-${SELECTED_RARITY.toLowerCase()} titled`);
        $('#raritySearch').text(SELECTED_RARITY);
    });

    //Weapon drop down when applicable
    if (slot.indexOf('Weapon') > -1 && readableSlot) {
        $('#toot').append(getWeaponDropdown(readableSlot));
        $(`#weapon option[value="${readableSlot}"]`).prop('selected', true);
        $(`#weapon`).on('input', () => {
           $(`#type`).text($('#weapon').val());
        });
    }

    //Stat dropdown
    $('#toot').append(getStatDropdown());
    $(`#stats option[value="${SELECTED_STAT}"]`).prop('selected', true);
    $('#stats').on('input', () => {
        SELECTED_STAT = $('#stats').val();
        $("#statName").text(SELECTED_STAT);
    });

    //Search button
    $('#toot').append(getSearchButton(slot));

}

/**
 * Create search button that displays results
 * @param slot
 * @returns {string}
 */
function getSearchButton(slot) {
    return `<div class="text-center"><button onclick="showResults('${slot}')" type="button" class="mt-2">Search</button><div>`;
}

/**
 * Drop down to filter on stat
 * @returns {string}
 */
function getStatDropdown() {

    let options = [];

    options.push(`<option value="">(Select one)</option>`);
    ALL_STATS.forEach((statName) => {
        options.push(`<option value="${statName}">${statName}</option>`);
    });

    return `<div class="mt-2 form-group">
                <label for="stats">Stat</label>
                <select class="form-control" id="stats">
                    ${options.join('')}
                </select>
            </div>`
}

/**
 * Drop down to filter on weapon type
 * @returns {string}
 */
function getWeaponDropdown() {

    let options = [];

    WEAPON_TYPES.forEach((type) => {
        options.push(`<option value="${type}">${type}</option>`);
    });

    return `<div class="mt-2 form-group">
                <label for="weapon">Weapon</label>
                <select class="form-control" id="weapon">
                    ${options.join('')}
                </select>
            </div>`
}

/**
 * Show results box
 * @param slot
 */
function showResults(slot) {

    //TODO: If no instance exists, we should have a default GABOItem that can be used in the same way (i.e. takes on all the prerequisits to function)
    let instance = CURRENT_GEAR[slot];

    let gaboItem = null;

    if (instance === undefined) {
        gaboItem = new GABOItem(null, null, '');
        gaboItem.setType(slot);
    } else {
        let item = ITEM_DATA[instance.id];
        gaboItem = new GABOItem(instance, item, '');
    }

    let existing = `<p><strong>You are already wearing a matching item</strong></p>`;

    let alreadyWearing = true;
    alreadyWearing = alreadyWearing && gaboItem.rarity === SELECTED_RARITY;
    alreadyWearing = alreadyWearing && gaboItem.statName === SELECTED_STAT;

    gaboItem.setRarity(SELECTED_RARITY.capitalize());
    gaboItem.setStatName(SELECTED_STAT);

    if (slot.indexOf('Weapon') > -1) {

        let subType = $("#weapon").val();
        alreadyWearing = alreadyWearing && gaboItem.subType === subType;
        gaboItem.setSubType(subType);
    }

    let searchText = $("#searchText").html();
    searchText = alreadyWearing ? existing + searchText : searchText;

    $("#toot").empty().append(searchText);

    let found = 0;
    found += displayGearList(gaboItem, GearOrganizer.findEquivalent, 'Matches');
    found += displayGearList(gaboItem, GearOrganizer.findSuperior, 'Superior');
    found += displayGearList(gaboItem, GearOrganizer.findConvertable, 'Convertable');
    found += displayGearList(gaboItem, GearOrganizer.findInferior, 'Inferior');

    if (found === 0) {
        $("#toot").append('<p>No results found</p>');
    }

}

/**
 * Gets the gear list from a particular find method in GearOrganizer
 * @param gaboItem
 * @param callback
 * @param header
 * @returns {*}
 */
function displayGearList(gaboItem, callback, header) {

    let gear = callback(gaboItem);

    let list = getGearList(gear);

    if (gear.length) {
        $("#toot").append(`
                <h5 class="mt-2 font-weight-bold">${header}</h5>
                ${list}
            `);
    }

    return gear.length;

}

/**
 * Builds the list of items, respecting item skins
 * @param gear
 * @returns {string}
 */
function getGearList(gear) {
    let pieces = [];

    gear.forEach((piece) => {

        let text = `<p><img class="item-img-sml img-fluid" src="${piece.icon}"/>` + piece.location;

        if (piece.skin !== '') {
            text += ` skinned as <img class="item-img-sml img-fluid" src="${piece.skinLink}"/><span class="rarity-${piece.rarity.toLowerCase()}">${SKIN_DATA[piece.skin].name}</span>`;
        }

        text += `</p>`;

        pieces.push(text);

    });

    return pieces.join('');
}

/**
 * Changes a slot to something readable instead of say...WeaponAquaticB
 * @param slot
 * @returns {*}
 */
function humanReadableSlot(slot) {

    ['WeaponA1', 'WeaponA2', 'WeaponB1', 'WeaponB2', 'WeaponAquaticA', 'WeaponAquaticB'].forEach((slotName) => {
        slot = slot.replace(slotName, getWeaponTypeFromSlot(slotName));
    });

    slot = slot.replace('1', '');
    slot = slot.replace('2', '');
    slot = slot.replace('HelmAquatic', 'Aquatic Helm');

    return slot;
}

/**
 * Grab the type of a weapon from the slot
 * @param slotName
 * @returns {*}
 */
function getWeaponTypeFromSlot(slotName) {
    let id = CURRENT_GEAR.access([slotName, 'id'], "");

    return ITEM_DATA.access([id, 'details', 'type'], "Weapon");

}

/**
 * Get the radio buttons used to select rarity
 * @returns {string}
 */
function getRarityRadios() {

    let radios = [];

    RARITIES.forEach((rarity) => {

        radios.push(`
                    <div class="form-check">
                      <label class="form-check-label">
                        <input type="radio" class="form-check-input" name="rarity-radio" id="rr-${rarity.toLowerCase()}" value="${rarity}"><span class="titled rarity-${rarity.toLowerCase()}">${rarity}</span>
                      </label>
                    </div>
                `);

    });

    return radios.join('');

}