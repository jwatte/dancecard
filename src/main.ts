// Main entry point for the Dance Card application
import './styles.css';
import { EventData, Participant, RoomCapacity } from './types';

// Utils functions are used indirectly by other imported functions

import {
	checkCsvRowLimit,
	parseEventsCSV,
	parseParticipantsCSV,
	parseRoomCapacityCSV,
} from './parsecsv';

import { generateDanceCards, renderDanceCardTable, resetDanceCardData } from './dancecard';

import { displayEvents, displayParticipants, displayRoomCapacities } from './tables';

import { ButtonStates, ElementId, ErrorMessages } from './constants';
import { initializeHelp } from './help';
import { createAppStructure } from './templates';

// Global arrays to store the parsed CSV data
const participants: Participant[] = [];
const events: EventData[] = [];
const roomCapacities: RoomCapacity[] = [];

// File handling utilities
interface FileHandlerConfig {
	errorElementId: ElementId;
	parseFunction: (content: string) => Array<Participant | EventData | RoomCapacity>;
	dataArray: Array<Participant | EventData | RoomCapacity>;
	displayFunction: () => void;
	validateFunction?: () => void;
}

// File error handling
const showFileError = (elementId: ElementId, message: string): void => {
	const errorElement = document.getElementById(elementId);
	if (errorElement) {
		errorElement.textContent = message;
		errorElement.style.opacity = '1';
	}
};

const clearFileError = (elementId: ElementId): void => {
	const errorElement = document.getElementById(elementId);
	if (errorElement) {
		errorElement.textContent = '';
		errorElement.style.opacity = '0';
	}
};

// Dance card results handling
const clearDanceCardResults = (): void => {
	const existingResults = document.querySelector('.dance-card-results');
	if (existingResults) {
		existingResults.remove();
	}
};

const handleFileContent = (
	content: string,
	config: FileHandlerConfig,
	fileInput: HTMLInputElement
): void => {
	if (!checkCsvRowLimit(content)) {
		showFileError(config.errorElementId, ErrorMessages.CSV_ROW_LIMIT);
		fileInput.value = '';
		return;
	}

	try {
		const parsedData = config.parseFunction(content);

		// Clear and update data
		config.dataArray.length = 0;
		config.dataArray.push(...parsedData);

		// Reset dance card data as data has changed
		resetDanceCardData();

		// Clear any existing dance card results
		clearDanceCardResults();

		// Display the data
		config.displayFunction();

		// Clear error and reset input
		clearFileError(config.errorElementId);
		fileInput.value = '';
	} catch (error) {
		showFileError(config.errorElementId, `Error parsing CSV: ${(error as Error).message}`);
		fileInput.value = '';
	}
};

// Button state management
const getMissingDataTypes = (): string[] => {
	const missing = [];
	if (participants.length === 0) missing.push(ErrorMessages.MISSING_DATA.PARTICIPANTS);
	if (events.length === 0) missing.push(ErrorMessages.MISSING_DATA.EVENTS);
	if (roomCapacities.length === 0) missing.push(ErrorMessages.MISSING_DATA.ROOM_CAPACITIES);
	return missing;
};

const validateEventRooms = (): string[] => {
	if (events.length === 0 || roomCapacities.length === 0) {
		return [];
	}

	const validRooms = new Set(roomCapacities.map((rc) => rc.room));
	const invalidRooms = new Set<string>();

	events.forEach((event) => {
		if (!validRooms.has(event.room)) {
			invalidRooms.add(event.room);
		}
	});

	return Array.from(invalidRooms);
};

const updateButtonState = (): void => {
	const button = document.getElementById(ElementId.DANCE_CARD_BUTTON) as HTMLButtonElement;
	const buttonHint = document.getElementById('button-hint');
	if (!button) return;

	const missing = getMissingDataTypes();
	const invalidRooms = validateEventRooms();

	if (invalidRooms.length > 0) {
		button.disabled = true;
		button.classList.add('button-disabled');
		button.title = `Events contain rooms that are not defined in room capacities: ${invalidRooms.join(', ')}`;
		if (buttonHint) {
			buttonHint.textContent = `Invalid rooms: ${invalidRooms.join(', ')}`;
		}
		// Optionally show this error in the events error section
		const eventsError = document.getElementById(ElementId.EVENTS_ERROR);
		if (eventsError) {
			eventsError.textContent = `Invalid rooms: ${invalidRooms.join(', ')}`;
		}
		return;
	}

	const isEnabled = missing.length === 0;
	button.disabled = !isEnabled;
	button.classList.toggle('button-disabled', !isEnabled);
	button.title = isEnabled ? '' : ButtonStates.DISABLED_FORMAT(missing);

	if (buttonHint) {
		if (isEnabled) {
			buttonHint.textContent = ''; // Clear the hint when enabled
		} else {
			buttonHint.textContent = ButtonStates.DISABLED_FORMAT(missing);
		}
	}
};

// Main button update function
const updateDanceCardButton = (): void => {
	updateButtonState();
};

// Initialize file handlers
const initializeFileHandlers = (): void => {
	const handlers: Record<string, FileHandlerConfig> = {
		[ElementId.PARTICIPANTS_UPLOAD]: {
			errorElementId: ElementId.PARTICIPANTS_ERROR,
			parseFunction: parseParticipantsCSV,
			dataArray: participants,
			displayFunction: () => {
				const participantList = document.getElementById(ElementId.PARTICIPANT_LIST);
				if (participantList) {
					displayParticipants(participants, participantList, updateDanceCardButton);
				}
			},
		},
		[ElementId.EVENTS_UPLOAD]: {
			errorElementId: ElementId.EVENTS_ERROR,
			parseFunction: parseEventsCSV,
			dataArray: events,
			displayFunction: () => {
				const eventsList = document.getElementById(ElementId.EVENTS_LIST);
				if (eventsList) {
					displayEvents(events, eventsList, updateDanceCardButton);
				}
			},
		},
		[ElementId.ROOM_CAPACITIES_UPLOAD]: {
			errorElementId: ElementId.ROOM_CAPACITIES_ERROR,
			parseFunction: parseRoomCapacityCSV,
			dataArray: roomCapacities,
			displayFunction: () => {
				const roomCapacityList = document.getElementById(ElementId.ROOM_CAPACITY_LIST);
				if (roomCapacityList) {
					displayRoomCapacities(roomCapacities, roomCapacityList, updateDanceCardButton);
				}
			},
		},
	};

	Object.entries(handlers).forEach(([elementId, config]) => {
		const fileInput = document.getElementById(elementId) as HTMLInputElement;
		if (fileInput) {
			fileInput.addEventListener('change', (event) => {
				const file = (event.target as HTMLInputElement).files?.[0];
				if (file) {
					const reader = new FileReader();
					reader.onload = (e) => {
						const content = e.target?.result as string;
						handleFileContent(content, config, fileInput);
						updateButtonState();
					};
					reader.readAsText(file);
				}
			});
		}
	});
};

// Handle dance card generation
const handleDanceCardClick = (): void => {
	clearDanceCardResults(); // Clear any existing results
	resetDanceCardData();
	const danceCards = generateDanceCards(participants, events, roomCapacities);
	renderDanceCardTable(danceCards, events);
};

// Initialize app
const initApp = (): void => {
	const appElement = document.getElementById(ElementId.APP);
	if (appElement) {
		// This was the problem - we're setting innerHTML of the app element itself
		appElement.innerHTML = createAppStructure();
	}

	const requiredElements = Object.values(ElementId);
	const missingElements = requiredElements.filter((id) => !document.getElementById(id));

	if (missingElements.length > 0) {
		console.error(ErrorMessages.MISSING_ELEMENTS, missingElements);
		return;
	}

	initializeFileHandlers();
	initializeHelp();
	updateButtonState();

	// Attach dance card button handler
	const danceCardButton = document.getElementById(ElementId.DANCE_CARD_BUTTON);
	if (danceCardButton) {
		danceCardButton.addEventListener('click', handleDanceCardClick);
	}
};

// Event listeners
document.addEventListener('DOMContentLoaded', initApp);

// Export functions for testing
export {
	generateDanceCards,
	handleDanceCardClick,
	initApp,
	renderDanceCardTable,
	updateDanceCardButton,
};
