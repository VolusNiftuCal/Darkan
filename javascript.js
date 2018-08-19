pdata = undefined;
function getData() {
    var name = document.getElementById('username').value.toLowerCase().split(' ');
    for (var i = 0; i < name.length; i++) {
        name[i] = name[i].charAt(0).toUpperCase() + name[i].substring(1);
    }
    name = name.join('_');
    pdata = new PlayerData(name, document.getElementById('player_data'));
}

function PlayerData(player, container) {
    this.container = container;
    this.api = 'http://darkan.org:5556/api/player/';
    this.player = player;
    this.url = this.api + this.player;
    
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
                info = undefined;
                npcKills = undefined;
                count = undefined;
                console.log('Player data successfully retrieved.');
                response.json().then(function(data) {
                    info = data; 
                    fetch(pd.url + '/npckills', {mode: 'cors'})
                        .then(function(response){
                            response.json().then(function(data) {
                                npcKills = data;
                                console.log('Npc Kills successfully retrieved')
                            });
                        });
                    fetch(pd.url + '/count', {mode: 'cors'})
                        .then(function(response){
                            response.json().then(function(data) {
                                count = data;
                                console.log('Count successfully retrieved');
                            });
                        });
                        
                    pd.isReadyTimer = setInterval(
                        function() {
                            var tries = 0;
                            if (npcKills !== undefined && count !== undefined) {
                                clearInterval(pd.isReadyTimer);
                                console.log('...ready!');
                                pd.display = new Display({player:pd.player, container:pd.container, info:info, npcKills:npcKills, count:count});
                            } else if (tries >= 600) {
                                clearInterval(pd.isReadyTimer);
                                pd.loadingError('Took too long to retrieve information.');
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
        });
    
    // Displays errors
    this.loadingError = function(status) {
        var message = 'Something went wrong. ¯\\_(?)_/¯';
        if (status === 404) {
            message = 'Player not found.';
        } else {
            message = 'Something went wrong while retrieving player data. Status Code: ' + status;
        }
        var errorMessage = newElement('div', { id:'error_message'});
        errorMessage.textContent = message;
        clearChildren(container);
        container.appendChild(errorMessage);
    }
    
}

function Display(data) {
    this.data = data;
    

    // General Information
    var player_info_container = newElement('div', { id:'player_info', className: 'data_container'});
    // Container for player title + player name
    var player_name_cont = newElement('button', { className:'collapsible'});
    // Name
    var player_name = newElement('span', {id:'player_name'});
    player_name.textContent = data.player.replace('_', ' ');

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

    // Clear the container and append everything
    clearChildren(data.container);
    data.container.appendChild(player_info_container);
    data.container.appendChild(player_npcKills_container);
    data.container.appendChild(player_count_container);
    addCollapsibles();
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

        player_data_content = newElement('div', { className:'content'});
        player_data_main_container.appendChild(player_data_content);

        for (data in dataList) {
            player_data_container = newElement('div', { className:'player_data_cont'});

            player_data_key = newElement('span', { className:'player_data_key'});
            player_data_key.textContent = data;
            player_data_container.appendChild(player_data_key);

            player_data_value = newElement('span', { className:'player_data_value'});
            player_data_value.textContent = dataList[data];
            player_data_container.appendChild(player_data_value);

            player_data_content.appendChild(player_data_container);
        }
        
        return player_data_main_container;
    }
    