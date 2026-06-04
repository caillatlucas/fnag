document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load Config
    const config = await configLoader.loadConfig();
    
    // 2. Initialize Game
    const game = new Game(config);
    game.init();
    
    // Disable context menu and drag to prevent accidental interactions
    document.addEventListener('contextmenu', event => event.preventDefault());
    document.addEventListener('dragstart', event => event.preventDefault());
});
