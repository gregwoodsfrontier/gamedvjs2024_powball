
window.addEventListener('load', function () {

	var game = new Phaser.Game({
		width: 600,
		height: 800,
		type: Phaser.AUTO,
        backgroundColor: "#242424",
		physics: {
			default: 'matter',
			matter: {
				debug: true,
			}
		},
		scale: {
			mode: Phaser.Scale.FIT,
			autoCenter: Phaser.Scale.CENTER_BOTH
		}
	});

	game.scene.add("Preload", Preload);
	game.scene.add("Level", Level);
    game.scene.add("Boot", Boot, true);
});

class Boot extends Phaser.Scene {

	preload() {
		
		this.load.pack("pack", "assets/preload-asset-pack.json");
	}

	create() {
		
        this.scene.start("Preload");
	}

}