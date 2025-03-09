import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../main';
import { createAppStructure } from '../templates';

describe('Main application', () => {
	beforeEach(() => {
		document.body.innerHTML = createAppStructure();
	});

	it('should initialize the app with all file upload sections', () => {
		initApp();

		// Try to find the expected elements
		const participantsInput = document.getElementById('participants-upload');
		const eventsInput = document.getElementById('events-upload');
		const roomCapacitiesInput = document.getElementById('room-capacities-upload');
		const participantList = document.getElementById('participant-list');
		const eventsList = document.getElementById('events-list');
		const roomCapacityList = document.getElementById('room-capacity-list');
		const danceCardButton = document.getElementById('dance-card-button');

		// Check that these elements exist
		expect(participantsInput).not.toBeNull();
		expect(eventsInput).not.toBeNull();
		expect(roomCapacitiesInput).not.toBeNull();
		expect(participantList).not.toBeNull();
		expect(eventsList).not.toBeNull();
		expect(roomCapacityList).not.toBeNull();
		expect(danceCardButton).not.toBeNull();

		// Verify file input attributes
		expect(participantsInput?.getAttribute('type')).toBe('file');
		expect(participantsInput?.getAttribute('accept')).toBe('.csv');
		expect(eventsInput?.getAttribute('type')).toBe('file');
		expect(eventsInput?.getAttribute('accept')).toBe('.csv');
		expect(roomCapacitiesInput?.getAttribute('type')).toBe('file');
		expect(roomCapacitiesInput?.getAttribute('accept')).toBe('.csv');
	});
});
