pdata = undefined;
abbreviate = false;

function getData() {
    var name = document.getElementById('username').value.toLowerCase().replace(' ', '_');
    pdata = new PlayerData(name, document.getElementById('player_data'));
}

function refreshData() {
    pdata = new PlayerData(pdata.player, document.getElementById('player_data'));
}

function PlayerData(player, container) {
    submit_user.setAttribute('disabled', '');
    this.container = container;
    this.api = 'http://darkan.org:5556/api/player/';
    this.player = player;
    this.url = this.api + this.player;

    this.info = undefined;
    this.npcKills = undefined;
    this.count = undefined;

    // Searches
    this.curNpcKills = undefined;
    this.curCount = undefined;
    
    // Timer that checks if all data is loaded
    this.isReadyTimer = undefined;
    
    // Setting up a loading screen while the process runs
    clearChildren(container)
    this.loadingScreen = newElement('span', { id:'loading_screen' });
    this.loadingScreen.textContent = 'Loading...';
    container.appendChild(this.loadingScreen);
   
    this.display = undefined;
    
    // Making life easier for nested functions
    pd = this;
    
    fetch(this.url, {mode: 'cors'})
        .then(function(response) {
            if (response.status !== 200) {
                pd.loadingError(response.status);
            } else {
                console.log(response.status);
                console.log('Player data successfully retrieved.');
                response.json().then(function(data) {
                    pd.info = data; 
                    fetch(pd.url + '/npckills', {mode: 'cors'})
                        .then(function(response){
                            response.json().then(function(data) {
                                pd.npcKills = data;
                                console.log('Npc Kills successfully retrieved')
                            });
                        });
                    fetch(pd.url + '/count', {mode: 'cors'})
                        .then(function(response){
                            response.json().then(function(data) {
                                pd.count = data;
                                console.log('Count successfully retrieved');
                            });
                        });
                    var tries = 0;    
                    pd.isReadyTimer = setInterval(
                        function() {
                            if (pd.npcKills !== undefined && pd.count !== undefined) {
                                clearInterval(pd.isReadyTimer);
                                console.log('...ready!');
                                pd.display = new Display({player:pd.player, container:pd.container, info:pd.info, npcKills:pd.npcKills, count:pd.count});
                            } else if (tries >= 200) {
                                clearInterval(pd.isReadyTimer);
                                pd.loadingError(999);
                            } else {
                                console.log('Waiting...');
                            }
                            tries++;
                        }, 100);
               });
            }
        })
        .catch(function(err) {
            console.log('Fetch error', err);
            pd.loadingError(err);
        });
    
    // Displays errors
    this.loadingError = function(status) {
        var message = 'Something went wrong. ¯\\_(?)_/¯';
        if (status === 404) {
            message = 'Player not found.';
        } else 
        if (status === 999) {
            message = 'Took too long to retrieve information. Please try again.'
        } else {
            message = 'Something went wrong while retrieving player data. Status Code: ' + status;
        }
        var errorMessage = newElement('div', { id:'error_message'});
        errorMessage.textContent = message;
        clearChildren(container);
        container.appendChild(errorMessage);
        submit_user.removeAttribute('disabled');
    }
    
}

function Display(data) {
    //this.data = data;
    

    // General Information
    var player_info_container = newElement('div', { id:'player_info', className: 'data_container'});
    // Container for player title + player name
    var player_name_cont = newElement('button', { className:'collapsible'});
    // Name
    var player_name = newElement('span', {id:'player_name'});
    player_name.textContent = formatName(data.player);

    // Title
    var player_title = newElement('span', {id:'player_title'});
    if (data.info.title) {
        // Remove tags
        player_title.textContent = data.info.title.replace(/(<([^>]+)>)/ig, '') + ' ';
        // Adds color
        if (data.info.title.indexOf('<col') !== -1) {
            player_title.style.color = '#' + data.info.title.substring(5, 11);
        }
        // Adds shadow
        if (data.info.title.indexOf('<sha') !== -1) {
            player_title.style.textShadow = '0.016em 0px 0px #' + data.info.title.substring(18, 24);
        }
    }
    player_name_cont.appendChild(player_title);
    player_name_cont.appendChild(player_name);
    player_info_container.appendChild(player_name_cont);

    player_info_content = newElement('div', {className:'content'});
    player_info_container.appendChild(player_info_content);

    // Stats
    // Total Level
    player_total_cont = newElement('div', {className:'player_skill_container'});
    // Icon
    player_total_icon = newElement('img', {className:'player_skill_icon'});
    player_total_icon.src = './assets/stats/Overall-icon.png';
    player_total_cont.appendChild(player_total_icon);
    // Level
    player_total_level = newElement('div', {className:'player_skill'});
    player_total_level.textContent = formatNumber(data.info.stats.totalLevel);
    player_total_cont.appendChild(player_total_level);
    // XP
    player_total_xp = newElement('div', {className:'player_xp'});
    player_total_xp.textContent = formatNumber(data.info.stats.totalXp);
    player_total_cont.appendChild(player_total_xp);
    // Append
    player_info_content.appendChild(player_total_cont);

    // Skills
    skillList = [ 'Attack', 'Defence', 'Strength', 'Hitpoints', 'Ranged', 'Prayer', 'Magic', 'Cooking', 'Woodcutting', 'Fletching', 'Fishing', 'Firemaking', 'Crafting', 'Smithing', 'Mining', 'Herblore', 'Agility', 'Thieving', 'Slayer', 'Farming', 'Runecrafting', 'Hunter', 'Construction', 'Summoning', 'Dungeoneering'];
    for (var i = 0; i < data.info.stats.skills.length; i++) {
        var player_skill_cont = newElement('div', {className:'player_skill_container'});
        var player_skill_icon = newElement('div', {className:'player_skill_icon'});
        player_skill_icon.style.backgroundImage = 'url(./assets/stats/' +skillList[i]+ '-icon.png)';
        player_skill_cont.appendChild(player_skill_icon);
        player_skill_level = newElement('div', {className:'player_skill'});
        player_skill_level.textContent = formatNumber(data.info.stats.skills[i].level);
        player_skill_cont.appendChild(player_skill_level);
        player_skill_xp = newElement('div', {className:'player_xp'});
        player_skill_xp.textContent = formatNumber(data.info.stats.skills[i].xp);
        player_skill_cont.appendChild(player_skill_xp);
        player_info_content.appendChild(player_skill_cont);
    }

    // Kills
    var player_npcKills_container = assembleData(data.npcKills, 'NPC Kills');

    // Count
    var player_count_container = assembleData(data.count, 'Count');

    // Adding the player's name to the title
    document.title = 'Darkan Achievements - ' + formatName(data.player);
    // Clearing the container
    clearChildren(data.container);

    // Refresh data button
    var refresh_button = newElement('button', {id:'refresh_button'});
    refresh_button.textContent = 'Refresh Data';
    refresh_button.onclick = function() { refreshData() };
    data.container.appendChild(refresh_button);

    // Displaying the data
    data.container.appendChild(player_info_container);
    data.container.appendChild(player_npcKills_container);
    data.container.appendChild(player_count_container);
    addCollapsibles();
    submit_user.removeAttribute('disabled');
}


// Removes all children from node
function clearChildren(node) {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}


function newElement(element, args={}) {
    var elem = document.createElement(element);
    if (args.id) { elem.id = args.id };
    if (args.className) { elem.className = args.className };
    return elem;
}

/* Format the number to make it easier to read
    ex: 1000 >= 1.000
        1000000 >= 1.000.000
*/
function formatNumber(n) {
    return n.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1.");
}

// Function for abbreviating numbers
/* ex:  1000 > 1k
        1000000 > 1m
        1500000 > 1.5m
*/
function roundNumber(n, precision) {
    prec = Math.pow(10, precision);
    return Math.floor(n*prec)/prec;
}

function abbreviateNumber(n) {
    base = Math.floor(Math.log(Math.abs(n))/Math.log(1000));
    suffix = 'kmbtqQ'[base-1];
    if (suffix) {
        return roundNumber(n/Math.pow(1000,base),1)+suffix;
    } else {
        return ''+n;
    }
}

function formatName(n) {
    n = n.split('_');
    for (var i = 0; i < n.length; i++) {
        n[i] = n[i].charAt(0).toUpperCase() + n[i].substring(1);
    }
    n = n.join(' ');
    return n;
}

function addCollapsibles() {
    var coll = document.getElementsByClassName("collapsible");
    var i;

    for (var i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function() {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.display === "block") {
                content.style.display = "none";
            } else {
                content.style.display = "block";
            }
        });
    }

    console.log('Collapsibles added.');
}

function assembleData(dataList, title) {
    var player_data_main_container = newElement('div', { className:'data_container'});
    var player_data_title = newElement('button', { className:'collapsible'});
    player_data_title.textContent = title;
    player_data_main_container.appendChild(player_data_title);

    var player_data_content = newElement('div', { className:'content'});
    player_data_main_container.appendChild(player_data_content);

    // List's search bar
    var player_data_content_s = newElement('div', { className:'player_data_search'});
    var player_data_content_s_form = newElement('form');
    player_data_content_s_form.action = 'javascript:false';
    player_data_content_s_form.onsubmit = function() {
        searchData(document.getElementById(title.replace(' ', '_') + '_query').value, Object.entries(dataList), document.getElementById(title.replace(' ', '_') + '_content'));
    };
    player_data_content_s.appendChild(player_data_content_s_form);
    var player_data_content_s_input = newElement('input', { id:title.replace(' ', '_') + '_query'});
    player_data_content_s_input.type = 'text'
    player_data_content_s_input.placeholder = 'Search...';
    player_data_content_s_form.appendChild(player_data_content_s_input);
    
    player_data_content.appendChild(player_data_content_s);

    // Information
    var player_data_content_info = newElement('div', { id: title.replace(' ', '_') + '_content'});
    player_data_content.appendChild(player_data_content_info);

    sortData(Object.entries(dataList), player_data_content_info);
    
    return player_data_main_container;
}

function keyComparator(a, b) {
    if (a[0] < b[0]) return -1;
    if (a[0] > b[0]) return 1;
    return 0;
}

function valComparator(a, b) {
    if (a[1] < b[1]) return -1;
    if (a[1] > b[1]) return 1;
    return 0;
}

function sortData(dataList, container, sortType) {
    //var dataList = Object.entries(data);

    switch (sortType) {
        case 'A-z':
            dataList = dataList.sort(keyComparator);
            break;
        case 'z-A':
            dataList = dataList.sort(keyComparator).reverse();
            break;
        case '0-9':
            dataList = dataList.sort(valComparator);
            break;
        case '9-0':
            dataList = dataList.sort(valComparator).reverse();
            break;

        default:
            break;
    }

    clearChildren(container);

    var data_content_sort = newElement('div', { className:'player_data_sort'});
    for (var i = 0; i < 4; i++) {
        var sort_options = [ 
                    'A-z',
                    'z-A',
                    '0-9',
                    '9-0'
                    ];
        var player_data_content_sort = newElement('button');
        player_data_content_sort.textContent = sort_options[i];
        player_data_content_sort.onclick = function() {
            sortData(dataList, container, this.textContent);
        };
        data_content_sort.appendChild(player_data_content_sort);
    }
    container.appendChild(data_content_sort);

    for (var i = 0; i < dataList.length; i++) {
        var player_data_container = newElement('div', { className:'player_data_cont'});

        var player_data_key = newElement('span', { className:'player_data_key'});
        player_data_key.textContent = dataList[i][0];
        player_data_container.appendChild(player_data_key);

        var player_data_value = newElement('span', { className:'player_data_value'});
        player_data_value.textContent = formatNumber(dataList[i][1])
        if (dataList[i][1] >= 10000 && abbreviate) {
            player_data_value.textContent += ' (' + abbreviateNumber(dataList[i][1]) + ')';
        }
        player_data_container.appendChild(player_data_value);

        container.appendChild(player_data_container);
    }
}

function searchData(query, dataList, container) {
    newList = [];
    if (query != '') {
        for (var i=0; i < dataList.length; i++) {
            if (dataList[i][0].toLowerCase().indexOf(query.toLowerCase()) !== -1) {
                newList.push(dataList[i]);
            }
        }
    } else {
        newList = dataList;
    }

    if (newList.length === 0) {
        newList.push(['Query not found', query]);
    }

    sortData(newList, container);
}
