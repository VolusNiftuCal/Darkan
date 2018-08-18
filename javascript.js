

function PlayerData(player, container) {
    this.container = container;
    this.api = 'http://darkan.org:5556/api/player/';
    this.name = player;
    this.url = this.api + this.name;
    
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
                            if (npcKills !== undefined && count !== undefined) {
                                clearInterval(pd.isReadyTimer);
                                console.log('...ready!');
                                pd.display = new Display({name:pd.player, container:pd.container, info:info, npcKills:npcKills, count:count});
                            } else {
                                console.log('Waiting...');
                            }
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
        var errorMessage = newElement('span', { id:'error_message'});
        errorMessage.textContent = message;
        clearChildren(container);
        container.appendChild(errorMessage);
    }
    
}

function Display(data) {
    this.data = data;
    
    var player_info_container = newElement('div', { id:'player_info', className: 'data_container'});
    var player_name = newElement('button', {id:'player_name', className: 'collapsible'});
    player_info_container.appendChild(player_name);

    data.container.appendChild(player_info_container);
    
    
    var player_npcKills_container = newElement('div', { id:'player_npcKills', className: 'data_container'});
    var player_count_container = newElement('div', { id:'player_count', className: 'data_container'});
}


// Removes chidlren from node
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