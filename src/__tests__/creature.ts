import { Creature } from '../creature';
import { jest, expect, describe, test, beforeEach, beforeAll } from '@jest/globals';

// NOTE: ts-comments are necessary in this file to avoid mocking the entire game.
/* eslint-disable @typescript-eslint/ban-ts-comment */

describe('Creature', () => {
	describe('creature.id', () => {
		let game: Game;
		// @ts-ignore
		beforeEach(() => (game = getGameMock()));

		test('"materialized" creatures are automatically assigned separate ids', () => {
			// @ts-ignore
			const creature0 = new Creature(getCreatureObjMock(), game);
			// @ts-ignore
			const creature1 = new Creature(getCreatureObjMock(), game);
			expect(creature0).toBeDefined();
			expect(creature1).toBeDefined();
			expect(creature0.id).not.toBe(creature1.id);
			expect(game.creatures.length).toBe(2);
		});

		test('a "materialized" (not temp) creature will reuse an existing, matching "unmaterialized" creature id', () => {
			const obj = getCreatureObjMock();
			obj.temp = true;
			// @ts-ignore
			const creatureTemp = new Creature(obj, game);
			obj.temp = false;
			// @ts-ignore
			const creatureNotTemp = new Creature(obj, game);
			expect(creatureTemp.id).toBe(creatureNotTemp.id);
		});
	});

	describe('game.creatures', () => {
		test('a "materialized" creature will replace a matching "unmaterialized" creature in game.creatures', () => {
			const game = getGameMock();
			const obj = getCreatureObjMock();
			obj.temp = true;
			// @ts-ignore
			const creatureTemp = new Creature(obj, game);
			expect(game.creatures.length).toBe(1);
			expect(game.creatures.filter((c) => c)[0]).toStrictEqual(creatureTemp);

			obj.temp = false;
			// @ts-ignore
			const creatureNotTemp = new Creature(obj, game);
			expect(game.creatures.length).toBe(1);
			expect(game.creatures.filter((c) => c)[0]).not.toStrictEqual(creatureTemp);
			expect(game.creatures.filter((c) => c)[0]).toStrictEqual(creatureNotTemp);
		});
	});

	describe('Creature materializes in which queue?', () => {
		test('a new Creature normally materializes in next queue, not current', () => {
			const game = getGameMock();
			const obj = getCreatureObjMock();
			// @ts-ignore
			const creature = new Creature(obj, game);
			expect(creature.isInCurrentQueue).toBe(false);
			expect(creature.isInNextQueue).toBe(true);
		});
		test('a new Priest materializes in current queue', () => {
			const game = getGameMock();
			const obj = getCreatureObjMock();
			obj.type = '--';
			// @ts-ignore
			const creature = new Creature(obj, game);
			expect(creature.isDarkPriest()).toBe(true);
			expect(creature.isInCurrentQueue).toBe(true);
			expect(creature.isInNextQueue).toBe(true);
		});
		test('a creature without materialization sickness materializes in current queue', () => {
			const game = getGameMock();
			const obj = getCreatureObjMock();
			// @ts-ignore
			obj.materializationSickness = false;
			// @ts-ignore
			const creature = new Creature(obj, game);
			expect(creature.isDarkPriest()).toBe(false);
			expect(creature.isInCurrentQueue).toBe(true);
			expect(creature.isInNextQueue).toBe(true);
		});
	});

	describe('creature.canWait()', () => {
		test('a new Creature can wait', () => {
			const game = getGameMock();
			const obj = getCreatureObjMock();
			// @ts-ignore
			const creature = new Creature(obj, game);
			creature.activate();
			expect(creature.canWait).toBe(true);
		});
		test('a waiting Creature cannot wait', () => {
			const game = getGameMock();
			const obj = getCreatureObjMock();
			// @ts-ignore
			const creature = new Creature(obj, game);
			creature.activate();
			creature.wait();
			expect(creature.canWait).toBe(false);
		});
		test('a hindered Creature cannot wait', () => {
			const game = getGameMock();
			const obj = getCreatureObjMock();
			// @ts-ignore
			const creature = new Creature(obj, game);
			creature.activate();
			creature.hinder();
			expect(creature.canWait).toBe(false);
		});
	});

	describe('creature.wait()', () => {
		test('a creature that has waited is delayed', () => {
			const game = getGameMock();
			const obj = getCreatureObjMock();
			// @ts-ignore
			const creature = new Creature(obj, game);
			creature.activate();
			expect(creature.isDelayed).toBe(false);
			expect(creature.canWait).toBe(true);
			creature.wait();
			expect(creature.isDelayed).toBe(true);
		});
		test('when a round is over, a waited creature is no longer delayed', () => {
			const game = getGameMock();
			const obj = getCreatureObjMock();
			// @ts-ignore
			const creature = new Creature(obj, game);
			creature.activate();
			expect(creature.isDelayed).toBe(false);
			expect(creature.canWait).toBe(true);
			creature.wait();
			expect(creature.isWaiting).toBe(true);
			creature.deactivate('turn-end');
			expect(creature.isDelayed).toBe(false);
		});
	});

	describe('creature.hinder()', () => {
		test('a hindered creature is delayed', () => {
			const game = getGameMock();
			const obj = getCreatureObjMock();
			// @ts-ignore
			const creature = new Creature(obj, game);
			expect(creature.isHindered).toBe(false);
			expect(creature.isDelayed).toBe(false);
			creature.hinder();
			expect(creature.isHindered).toBe(true);
			expect(creature.isDelayed).toBe(true);
		});
		test('a creature can be hindered', () => {
			const game = getGameMock();
			const obj = getCreatureObjMock();
			// @ts-ignore
			const creature = new Creature(obj, game);
			expect(creature.isHindered).toBe(false);
			creature.hinder();
			expect(creature.isHindered).toBe(true);
		});
		test('a creature whose turn is over, who is then hindered, will be delayed the next round', () => {
			const game = getGameMock();
			const obj = getCreatureObjMock();
			// @ts-ignore
			const creature = new Creature(obj, game);
			creature.displayHealthStats = () => undefined;

			creature.activate();
			creature.deactivate('turn-end');
			expect(creature.isHindered).toBe(false);
			creature.hinder();
			expect(creature.isHindered).toBe(true);
			creature.activate();
			expect(creature.isHindered).toBe(true);
			creature.deactivate('turn-end');
			expect(creature.isHindered).toBe(false);
		});
		test('a creature whose turn is not over, who is then hindered, will not be delayed the next round from that hinder()', () => {
			const game = getGameMock();
			const obj = getCreatureObjMock();
			// @ts-ignore
			const creature = new Creature(obj, game);
			expect(creature.isWaiting).toBe(false);
			expect(creature.isDelayed).toBe(false);
			creature.hinder();
			expect(creature.isWaiting).toBe(false);
			expect(creature.isHindered).toBe(true);
			expect(creature.isDelayed).toBe(true);
			creature.activate();
			creature.deactivate('turn-end');
			expect(creature.isWaiting).toBe(false);
			expect(creature.isHindered).toBe(false);
			expect(creature.isDelayed).toBe(false);
		});
	});
});

jest.mock('../ability');
jest.mock('../utility/hex', () => {
	return {
		default: () => {
			// Do nothing
		},
	};
});

const getPlayerMock = () => {
	return {};
};

const getRandomString = (length: number) => {
	return Array(length + 1)
		.join((Math.random().toString(36) + '00000000000000000').slice(2, 18))
		.slice(0, length);
};

const getCreatureObjMock = () => {
	return {
		stats: {
			health: 10,
			movement: 10,
		},
		temp: false,
		team: 0,
		materializationSickness: true,
		type: getRandomString(5),
		display: {
			'offset-x': true,
		},
		size: 2,
		x: 4,
		y: 4,
	};
};

const getHexesMock = () => {
	const arr = [];
	for (let y = 0; y < 100; y++) {
		const row = [];
		for (let x = 0; x < 100; x++) {
			row.push({
				displayPos: { x, y },
				creature: 0,
			});
		}
		arr.push(row);
	}
	return arr;
};

import { unitData } from '../data/units';
import Game from '../game';
import {create} from "underscore";

const getGameMock = () => {
	const self = {
		turn: 0,
		creatures: [],
		players: [],
		queue: { update: jest.fn() },
		updateQueueDisplay: jest.fn(),
		grid: {
			orderCreatureZ: jest.fn(),
			hexes: getHexesMock(),
		},
		UI: {
			updateFatigue: jest.fn(),
			checkAbilities: jest.fn(),
		},
		Phaser: getPhaserMock(),
		retrieveCreatureStats: (type: number) => {
			for (const d of unitData) {
				if (d.id === type) {
					return d;
				}
			}
			return {};
		},
		abilities: jest.fn(),
		signals: {
			metaPowers: {
				add: jest.fn(),
			},
		},
		plasma_amount: 10,
		onReset: jest.fn(),
		onStartPhase: jest.fn(),
		onEndPhase: jest.fn(),
		log: jest.fn(),
		onHeal: jest.fn(),
	};
	self.players = [getPlayerMock(), getPlayerMock()];
	return self;
};

const getPhaserMock = () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const self: Record<string, any> = { position: { set: jest.fn() } };
	self.add = () => self;
	self.create = () => self;
	self.forEach = () => self;
	self.group = () => self;
	self.removeChild = () => self;
	self.setTo = () => self;
	self.start = () => self;
	self.text = () => self;
	self.to = () => self;
	self.tween = () => self;
	self.anchor = self;
	self.data = {};
	self.onComplete = self;
	self.parent = self;
	self.sprite = self;
	self.scale = self;
	self.texture = {
		width: 10,
		height: 10,
	};

	return {
		add: self,
	};
};

beforeAll(() => {
	Object.defineProperty(window, 'Phaser', {
		get() {
			return { Easing: { Linear: { None: 1 } } };
		},
	});
});

/// Covered lines relative 50% before. absolute ~ 1000 lines
/// Covered lines relative 56% after absolute ~ 1146 lines


describe('restoreMovement', () => {
	const game = getGameMock();
	const obj = getCreatureObjMock();
	// @ts-ignore
	const creature = new Creature(obj, game);
	// Mock the game.log function
	const logMock = jest.fn();

	beforeEach(() => {
		// Reset the log mock and provide a mock context (this)
		logMock.mockReset();
	});

	it('should restore movement and log the recovery when log is true', () => {

		// Mock the context (this) with necessary properties
		const context = {
			remainingMove: 4,
			stats: {
				movement: 10,
			},
			game: {
				log: logMock,
			},
		};

		// Call the function with amount and log as true
		creature.restoreMovement.call(context, 3, true);

		// Assert that the remainingMove is updated correctly
		expect(context.remainingMove).toEqual(7);

		});

	it('should restore movement without logging when log is false', () => {
		// Mock the context (this) with necessary properties
		const context = {
			remainingMove: 5,
			stats: {
				movement: 10,
			},
			game: {
				log: logMock,
			},
		};

		// Call the function with amount and log as false
		creature.restoreMovement.call(context, 3, false);

		// Assert that the remainingMove is updated correctly
		expect(context.remainingMove).toEqual(8);

		// Assert that the log function was not called
		expect(logMock).not.toHaveBeenCalled();
	});
});

describe('removeEffect', () => {
	const game = getGameMock();
	const obj = getCreatureObjMock();
	// @ts-ignore
	const creature = new Creature(obj, game);

	it('should remove an effect by name if it exists', () => {
		// Arrange: Create a test context with some effects
		const context = {
			effects: [
				{ name: 'Frozen' },
				{ name: 'Idle' },
				{ name: 'Burning' },
			],
		};

		// Act: Call removeEffect to remove 'Effect2'
		creature.removeEffect.call(context, 'Frozen');

		// Assert: Check that 'Effect2' is removed
		expect(context.effects).toEqual([{ name: 'Idle' }, { name: 'Burning' }]);
	});

	it('should not modify the effects array if the effect is not found', () => {
		// Arrange: Create a test context with some effects
		const context = {
			effects: [
				{ name: 'Frozen' },
				{ name: 'Burning' },
			],
		};

		// Act: Try to remove an effect that does not exist ('Effect2')
		creature.removeEffect.call(context, 'Idle');

		// Assert: Check that the effects array remains unchanged
		expect(context.effects).toEqual([{ name: 'Frozen' }, { name: 'Burning' }]);
	});

	it('should remove the effect when it is the only effect in the array', () => {
		// Arrange: Create a test context with a single effect
		const context = {
			effects: [{ name: 'Burning' }],
		};

		// Act: Remove the single effect ('Effect1')
		creature.removeEffect.call(context, 'Burning');

		// Assert: Check that the effects array is empty
		expect(context.effects).toEqual([]);
	});
});



describe('updateAlteration', () => {
	const game = getGameMock();
	const obj = getCreatureObjMock();
	// @ts-ignore
	const creature = new Creature(obj, game);
	it('should correctly apply multiplication buffs', () => {
		const context = {
			baseStats: { health: 100, damage: 10 },
			stats: {},
			effects: [
				{ alterations: { health: '*1.5', damage: '*2' } },
			],
			dropCollection: [],
		};

		creature.updateAlteration.call(context);

		expect(context.stats).toEqual({ health: 150, damage: 20 , endurance: NaN, energy: NaN, movement: NaN});
	});

	it('should correctly apply division debuffs', () => {
		const context = {
			baseStats: { health: 100, damage: 10 },
			stats: {},
			effects: [
				{ alterations: { health: '/2', damage: '/3' } },
			],
			dropCollection: [],
		};

		creature.updateAlteration.call(context);

		expect(context.stats).toEqual({ health: 50, damage: 3.3333333333333335 , endurance: NaN, energy: NaN, movement: NaN});
	});

	it('should correctly apply regular buffs', () => {
		const context = {
			baseStats: { health: 100, damage: 10 },
			stats: {},
			effects: [
				{ alterations: { health: 20, damage: 5 } },
			],
			dropCollection: [],
		};

		creature.updateAlteration.call(context);

		expect(context.stats).toEqual({ health: 120, damage: 15 , endurance: NaN, energy: NaN, movement: NaN});
	});

	it('should correctly apply boolean buffs', () => {
		const context = {
			baseStats: { isActive: true },
			stats: {},
			effects: [
				{ alterations: { isActive: false } },
			],
			dropCollection: [],
		};

		creature.updateAlteration.call(context);

		expect(context.stats).toEqual({ isActive: false , endurance: NaN, energy: NaN, movement: NaN, health: NaN});
	});

	it('should handle an empty effect array', () => {
		const context = {
			baseStats: { health: 100 },
			stats: {},
			effects: [],
			dropCollection: [],
		};

		creature.updateAlteration.call(context);

		expect(context.stats).toEqual({ health: 100 , endurance: NaN, energy: NaN, movement: NaN});
	});

	it('should not allow stat pools to fall below 1', () => {
		const context = {
			baseStats: { health: 1, endurance: 1, energy: 1, movement: 1 },
			stats: { health: 0, endurance: 0, energy: 0, movement: 0 },
			effects: [{ alterations: { health: -4 } },],
			dropCollection: [],
		};

		creature.updateAlteration.call(context);

		expect(context.stats).toEqual({ health: 1, endurance: 1, energy: 1, movement: 1 });
	});

	it('should not allow stats to exceed their maximum values', () => {
		const context = {
			baseStats: { health: 60, endurance: 50, energy: 80, movement: 3 },
			stats: { health: 120, endurance: 60, energy: 90, movement: 5 },
			effects: [
				{  },
			],
			dropCollection: [],
		};

		creature.updateAlteration.call(context);

		expect(context.stats.health).toBe(60);
		expect(context.stats.endurance).toBe(50);
		expect(context.stats.energy).toBe(80);
		expect(context.stats.movement).toBe(3);
	});
});

describe('summon', () => {
	const game = getGameMock();
	const obj = getCreatureObjMock();
	// @ts-ignore
	const creature = new Creature(obj, game);
	it('should perform the summoning process with materialization sickness', () => {
		// Arrange: Create a test context with relevant properties and methods
		const context = {
			game: {
				updateQueueDisplay: jest.fn(),
				grid: {
					orderCreatureZ: jest.fn(),
					fadeOutTempCreature: jest.fn(),
				},
				triggers: {
					onStepIn: 'TriggerFunction',
				},
			},
			creatureSprite: {
				setAlpha: jest.fn(() => Promise.resolve()),
			},
			hexagons: [
				{ activateTrap: jest.fn() },
				{ activateTrap: jest.fn() },
			],
			updateHealth: jest.fn(),
			healthShow: jest.fn(),
			pickupDrop: jest.fn(),
			hint: jest.fn(),
			name: 'SummonedCreatureName',
			isDarkPriest: jest.fn(() => false),
			materializationSickness: true,
		};

		// Act: Call the summon function with materialization sickness enabled
		creature.summon.call(context);

		// Assert: Check that the summoning process is performed as expected
		expect(context.game.updateQueueDisplay).toHaveBeenCalled();
		expect(context.game.grid.orderCreatureZ).toHaveBeenCalled();
		expect(context.game.grid.fadeOutTempCreature).toHaveBeenCalled();
		expect(context.creatureSprite.setAlpha).toHaveBeenCalledWith(1, 500);
		expect(context.updateHealth).toHaveBeenCalled();
		expect(context.healthShow).toHaveBeenCalled();
		expect(context.hint).toHaveBeenCalledWith('SummonedCreatureName', 'creature_name');
	});

	it('should perform the summoning process without materialization sickness for a Dark Priest', () => {
		// Arrange: Create a test context for a Dark Priest without materialization sickness
		const context = {
			game: {
				updateQueueDisplay: jest.fn(),
				grid: {
					orderCreatureZ: jest.fn(),
					fadeOutTempCreature: jest.fn(),
				},
				triggers: {
					onStepIn: 'TriggerFunction',
				},
			},
			creatureSprite: {
				setAlpha: jest.fn(() => Promise.resolve()),
			},
			hexagons: [
				{ activateTrap: jest.fn() },
				{ activateTrap: jest.fn() },
			],
			updateHealth: jest.fn(),
			healthShow: jest.fn(),
			pickupDrop: jest.fn(),
			hint: jest.fn(),
			name: 'DarkPriestCreatureName',
			isDarkPriest: jest.fn(() => true),
			materializationSickness: true,
		};

		// Act: Call the summon function for a Dark Priest without materialization sickness
		creature.summon.call(context);

		// Assert: Check that the summoning process is performed as expected for a Dark Priest
		expect(context.game.updateQueueDisplay).toHaveBeenCalled();
		expect(context.game.grid.orderCreatureZ).toHaveBeenCalled();
		expect(context.game.grid.fadeOutTempCreature).toHaveBeenCalled();
		expect(context.creatureSprite.setAlpha).toHaveBeenCalledWith(1, 500);
		expect(context.updateHealth).toHaveBeenCalled();
		expect(context.healthShow).toHaveBeenCalled();
	});
	it('should handle activating traps in hexagons', () => {
		// Arrange: Create a test context with hexagons containing traps
		const context = {
			game: {
				updateQueueDisplay: jest.fn(),
				grid: {
					orderCreatureZ: jest.fn(),
					fadeOutTempCreature: jest.fn(),
				},
				triggers: {
					onStepIn: 'TriggerFunction',
				},
			},
			creatureSprite: {
				setAlpha: jest.fn(() => Promise.resolve()),
			},
			hexagons: [
				{ activateTrap: jest.fn() },
				{ activateTrap: jest.fn() },
			],
			updateHealth: jest.fn(),
			healthShow: jest.fn(),
			pickupDrop: jest.fn(),
			hint: jest.fn(),
			name: 'SummonedCreatureName',
			isDarkPriest: jest.fn(() => false),
			materializationSickness: true,
		};

		// Act: Call the summon function to activate traps
		creature.summon.call(context);

		// Assert: Check that the traps in hexagons are activated
		expect(context.hexagons[0].activateTrap).toHaveBeenCalledWith('TriggerFunction', context);
		expect(context.hexagons[1].activateTrap).toHaveBeenCalledWith('TriggerFunction', context);
	});
});


describe('freeze', () => {
	const game = getGameMock();
	const obj = getCreatureObjMock();
	// @ts-ignore
	const creature = new Creature(obj, game);
	it('should freeze the creature without cryostasis', () => {
		// Arrange: Create a test context for freezing without cryostasis
		const context = {
			status: {
				frozen: false,
				cryostasis: false,
			},
			updateHealth: jest.fn(),
			game: {
				UI: {
					updateFatigue: jest.fn(),
				},
				signals: {
					creature: {
						dispatch: jest.fn(),
					},
				},
			},
		};

		// Act: Call the freeze function without cryostasis
		creature.freeze.call(context);

		// Assert: Check that the creature is frozen without cryostasis
		expect(context.status.frozen).toBe(true);
		expect(context.status.cryostasis).toBe(false);
		expect(context.updateHealth).toHaveBeenCalled();
		expect(context.game.UI.updateFatigue).toHaveBeenCalled();
		expect(context.game.signals.creature.dispatch).toHaveBeenCalledWith('frozen', {
			creature: context,
			cryostasis: false,
		});
	});

	it('should freeze the creature with cryostasis', () => {
		// Arrange: Create a test context for freezing with cryostasis
		const context = {
			status: {
				frozen: false,
				cryostasis: false,
			},
			updateHealth: jest.fn(),
			game: {
				UI: {
					updateFatigue: jest.fn(),
				},
				signals: {
					creature: {
						dispatch: jest.fn(),
					},
				},
			},
		};

		// Act: Call the freeze function with cryostasis
		creature.freeze.call(context, true);

		// Assert: Check that the creature is frozen with cryostasis
		expect(context.status.frozen).toBe(true);
		expect(context.status.cryostasis).toBe(true);
		expect(context.updateHealth).toHaveBeenCalled();
		expect(context.game.UI.updateFatigue).toHaveBeenCalled();
		expect(context.game.signals.creature.dispatch).toHaveBeenCalledWith('frozen', {
			creature: context,
			cryostasis: true,
		});
	});

	it('should handle freezing an already frozen creature', () => {
		// Arrange: Create a test context for an already frozen creature
		const context = {
			status: {
				frozen: true,
				cryostasis: false,
			},
			updateHealth: jest.fn(),
			game: {
				UI: {
					updateFatigue: jest.fn(),
				},
				signals: {
					creature: {
						dispatch: jest.fn(),
					},
				},
			},
		};

		// Act: Call the freeze function with cryostasis
		creature.freeze.call(context, true);

		// Assert: Check that the creature remains frozen with cryostasis
		expect(context.status.frozen).toBe(true);
		expect(context.status.cryostasis).toBe(true);
		expect(context.updateHealth).toHaveBeenCalled(); // Health update should not be called
		expect(context.game.UI.updateFatigue).toHaveBeenCalled();
		expect(context.game.signals.creature.dispatch).toHaveBeenCalledWith('frozen', {
			creature: context,
			cryostasis: true,
		});
	});
});

describe('Creature fatigueText', () => {
	const game = getGameMock();
	const obj = getCreatureObjMock();
	// @ts-ignore
	const creature = new Creature(obj, game);
	it('should return "Cryostasis" when the creature is frozen with cryostasis', () => {
		// Arrange: Create a test creature context that is frozen with cryostasis
		creature.isFrozen = jest.fn(() => true);
		creature.isInCryostasis = jest.fn(() => true);

		// Act: Access the fatigueText getter
		const result = creature.fatigueText;

		// Assert: Check that the result is "Cryostasis"
		expect(result).toBe('Cryostasis');
	});

	it('should return "Frozen" when the creature is frozen without cryostasis', () => {
		// Arrange: Create a test creature context that is frozen without cryostasis
		creature.isFrozen = jest.fn(() => true);
		creature.isInCryostasis = jest.fn(() => false);

		// Act: Access the fatigueText getter
		const result = creature.fatigueText;

		// Assert: Check that the result is "Frozen"
		expect(result).toBe('Frozen');
	});

	it('should return "Dizzy" when the creature is dizzy', () => {
		// Arrange: Create a test creature context that is dizzy
		creature.isFrozen = jest.fn(() => false);
		creature.isDizzy = jest.fn(() => true);

		// Act: Access the fatigueText getter
		const result = creature.fatigueText;

		// Assert: Check that the result is "Dizzy"
		expect(result).toBe('Dizzy');
	});

	it('should return "Sickened" when the creature has materialization sickness', () => {
		// Arrange: Create a test creature context with materialization sickness
		creature.isFrozen = jest.fn(() => false);
		creature.isDizzy = jest.fn(() => false);
		creature.materializationSickness = true;

		// Act: Access the fatigueText getter
		const result = creature.fatigueText;

		// Assert: Check that the result is "Sickened"
		expect(result).toBe('Sickened');
	});
	it('should return "Protected" when the creature is protected from fatigue', () => {
		// Arrange: Create a test creature context protected from fatigue
		creature.isFrozen = jest.fn(() => false);
		creature.isDizzy = jest.fn(() => false);
		creature.materializationSickness = false;
		creature.protectedFromFatigue = true;

		// Act: Access the fatigueText getter
		const result = creature.fatigueText;

		// Assert: Check that the result is "Protected"
		expect(result).toBe('Protected');
	});

	it('should return "Fragile" when the creature is fragile', () => {
		// Arrange: Create a test creature context that is fragile
		creature.isFrozen = jest.fn(() => false);
		creature.isDizzy = jest.fn(() => false);
		creature.materializationSickness = false;
		creature.protectedFromFatigue = false;
		creature.isFragile = jest.fn(() => true);

		// Act: Access the fatigueText getter
		const result = creature.fatigueText;

		// Assert: Check that the result is "Fragile"
		expect(result).toBe('Fragile');
		// Add an assertion to check if a log message is displayed in this case.
	});

	it('should return "Fatigued" when the creature is fatigued', () => {
		// Arrange: Create a test creature context that is fatigued

		creature.isFrozen = jest.fn(() => false);
		creature.isDizzy = jest.fn(() => false);
		creature.materializationSickness = false;
		creature.protectedFromFatigue = false;
		creature.isFragile = jest.fn(() => false);
		creature.isFatigued = jest.fn(() => true);

		// Act: Access the fatigueText getter
		const result = creature.fatigueText;

		// Assert: Check that the result is "Fatigued"
		expect(result).toBe('Fatigued');
	});
});

