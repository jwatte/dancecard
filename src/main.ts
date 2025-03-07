// Main entry point for the Dance Card application
import './styles.css';
import { 
	FileInputEvent, 
	Participant, 
	Event, 
	RoomCapacity, 
	ParticipantDanceCard
} from './types';

import {
	validateAndNormalizeTime
} from './utils';

import {
	parseParticipantsCSV,
	parseEventsCSV,
	parseRoomCapacityCSV,
	checkCsvRowLimit
} from './parsecsv';

import {
	generateDanceCards,
	renderDanceCardTable,
	resetDanceCardData,
	exportDanceCardsCSV
} from './dancecard';

import {
	displayParticipants,
	displayEvents,
	displayRoomCapacities
} from './tables';

// Global arrays to store the parsed CSV data
const participants: Participant[] = [];
const events: Event[] = [];
const roomCapacities: RoomCapacity[] = [];

// Function to check if all data sets are loaded and enable/disable the dance card button
const updateDanceCardButton = () => {
	const danceCardButton = document.getElementById('dance-card-button') as HTMLButtonElement;
	const buttonHint = document.getElementById('button-hint');
	if (!danceCardButton || !buttonHint) return;
	
	const isEnabled = participants.length > 0 && events.length > 0 && roomCapacities.length > 0;
	danceCardButton.disabled = !isEnabled;
	
	// Update button appearance and hint text based on state
	if (isEnabled) {
		danceCardButton.classList.add('button-enabled');
		danceCardButton.classList.remove('button-disabled');
		buttonHint.textContent = 'Press to generate dance cards';
	} else {
		danceCardButton.classList.add('button-disabled');
		danceCardButton.classList.remove('button-enabled');
		
		// Create more specific hint message based on what's missing
		let message = 'Upload ';
		const missing = [];
		if (participants.length === 0) missing.push('participants');
		if (events.length === 0) missing.push('events');
		if (roomCapacities.length === 0) missing.push('room capacities');
		
		// Format the message
		if (missing.length === 1) {
			message += missing[0] + ' to enable';
		} else if (missing.length === 2) {
			message += missing[0] + ' and ' + missing[1] + ' to enable';
		} else {
			message += 'all CSV files to enable';
		}
		
		buttonHint.textContent = message;
	}
};

// Function to handle FileReader onload event for participant CSV files
function handleParticipantFileLoad(e: ProgressEvent<FileReader>, fileInput: HTMLInputElement): void {
	try {
		const content = e.target?.result as string;
		
		// Check if the file has too many rows
		if (!checkCsvRowLimit(content)) {
			alert('Error: CSV file exceeds the maximum limit of 999 data rows. Please upload a smaller file.');
			fileInput.value = '';
			return;
		}
		
		const parsedData = parseParticipantsCSV(content);
		
		// Clear current data and add new data
		participants.length = 0;
		participants.push(...parsedData);
		
		// Reset dance card data as participant list has changed
		resetDanceCardData();
		
		// Display the data
		displayParticipantsTable();
		
		// Reset file input
		fileInput.value = '';
	} catch (error) {
		alert(`Error parsing CSV: ${(error as Error).message}`);
	}
}

// Function to handle participant CSV file upload
const handleParticipantUpload = (event: FileInputEvent) => {
	const fileInput = event.target;
	const file = fileInput.files?.[0];
	
	if (!file) return;
	
	// Only accept CSV files
	if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
		alert('Please upload a CSV file');
		fileInput.value = '';
		return;
	}
	
	const reader = new FileReader();
	function handleLoad(e: ProgressEvent<FileReader>) {
		handleParticipantFileLoad(e, fileInput);
	}
	reader.onload = handleLoad;
	reader.readAsText(file);
};

// Function to handle FileReader onload event for events CSV files
function handleEventsFileLoad(e: ProgressEvent<FileReader>, fileInput: HTMLInputElement): void {
	try {
		const content = e.target?.result as string;
		
		// Check if the file has too many rows
		if (!checkCsvRowLimit(content)) {
			alert('Error: CSV file exceeds the maximum limit of 999 data rows. Please upload a smaller file.');
			fileInput.value = '';
			return;
		}
		
		const parsedData = parseEventsCSV(content);
		
		// Clear current data and add new data
		events.length = 0;
		events.push(...parsedData);
		
		// Reset dance card data as events list has changed
		resetDanceCardData();
		
		// Check for missing rooms if room capacities are loaded
		if (roomCapacities.length > 0) {
			validateEventRooms();
		}
		
		// Display the data
		displayEventsTable();
		
		// Reset file input
		fileInput.value = '';
	} catch (error) {
		alert(`Error parsing CSV: ${(error as Error).message}`);
	}
}

// Function to handle events CSV file upload
const handleEventsUpload = (event: FileInputEvent) => {
	const fileInput = event.target;
	const file = fileInput.files?.[0];
	
	if (!file) return;
	
	// Only accept CSV files
	if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
		alert('Please upload a CSV file');
		fileInput.value = '';
		return;
	}
	
	const reader = new FileReader();
	function handleLoad(e: ProgressEvent<FileReader>) {
		handleEventsFileLoad(e, fileInput);
	}
	reader.onload = handleLoad;
	reader.readAsText(file);
};

// Function to handle FileReader onload event for room capacity CSV files
function handleRoomCapacityFileLoad(e: ProgressEvent<FileReader>, fileInput: HTMLInputElement): void {
	try {
		const content = e.target?.result as string;
		
		// Check if the file has too many rows
		if (!checkCsvRowLimit(content)) {
			alert('Error: CSV file exceeds the maximum limit of 999 data rows. Please upload a smaller file.');
			fileInput.value = '';
			return;
		}
		
		const parsedData = parseRoomCapacityCSV(content);
		
		// Clear current data and add new data
		roomCapacities.length = 0;
		roomCapacities.push(...parsedData);
		
		// Reset dance card data as room capacities have changed
		resetDanceCardData();
		
		// Check for missing rooms if events are loaded
		if (events.length > 0) {
			validateEventRooms();
		}
		
		// Display the data
		displayRoomCapacitiesTable();
		
		// Reset file input
		fileInput.value = '';
	} catch (error) {
		alert(`Error parsing CSV: ${(error as Error).message}`);
	}
}

// Function to handle room capacity CSV file upload
const handleRoomCapacityUpload = (event: FileInputEvent) => {
	const fileInput = event.target;
	const file = fileInput.files?.[0];
	
	if (!file) return;
	
	// Only accept CSV files
	if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
		alert('Please upload a CSV file');
		fileInput.value = '';
		return;
	}
	
	const reader = new FileReader();
	function handleLoad(e: ProgressEvent<FileReader>) {
		handleRoomCapacityFileLoad(e, fileInput);
	}
	reader.onload = handleLoad;
	reader.readAsText(file);
};

// Function to validate that all event rooms exist in room capacities
const validateEventRooms = () => {
	// Create a set of all room names from room capacities for quick lookup
	const validRooms = new Set(roomCapacities.map(rc => rc.room));
	
	// Find events with invalid rooms
	const invalidEvents = events.filter(event => !validRooms.has(event.room));
	
	if (invalidEvents.length > 0) {
		// Create a list of the invalid rooms (removing duplicates)
		const invalidRooms = [...new Set(invalidEvents.map(event => event.room))];
		
		alert(`Warning: The following rooms in the events file don't exist in the room capacity file: ${invalidRooms.join(', ')}`);
	}
};

// Function to display participants - delegates to tables.ts
const displayParticipantsTable = () => {
	const participantList = document.getElementById('participant-list');
	if (participantList) {
		displayParticipants(participants, participantList, updateDanceCardButton);
	}
};

// Function to display events - delegates to tables.ts
const displayEventsTable = () => {
	const eventsList = document.getElementById('events-list');
	if (eventsList) {
		displayEvents(events, eventsList, updateDanceCardButton);
	}
};

// Function to display room capacities - delegates to tables.ts
const displayRoomCapacitiesTable = () => {
	const roomCapacityList = document.getElementById('room-capacity-list');
	if (roomCapacityList) {
		displayRoomCapacities(roomCapacities, roomCapacityList, updateDanceCardButton);
	}
};

// Function to handle dance card button click
const handleDanceCardClick = () => {
	// Reset any existing data
	resetDanceCardData();
	
	// Generate dance cards
	const danceCards = generateDanceCards(participants, events, roomCapacities);
	
	// Render the dance card table
	renderDanceCardTable(danceCards, events);
};

// Initialize the application
export const initApp = () => {
	const app = document.getElementById('app');
	if (!app) return;
	
	app.innerHTML = `
		<!-- Dance Cards button section -->
		<div class="dance-card-container">
			<button id="dance-card-button" class="dance-card-button button-disabled" disabled>Dance Cards</button>
			<p id="button-hint" class="button-hint">Upload all CSV files to enable</p>
		</div>
		
		<div class="grid-container grid-container-3col">
			<!-- Left column: Participants upload -->
			<div class="grid-item csv-upload">
				<div class="upload-section">
					<h2>Upload Participants</h2>
					<p>Select a CSV file with ID and Name columns:</p>
					<input type="file" id="participants-upload" accept=".csv,text/csv" />
					<label for="participants-upload">Choose File</label>
					<p class="hint">CSV format requires ID and Name columns.</p>
					<div class="file-actions">
						<a href="sample.csv" download="sample.csv" class="download-link">Download Sample CSV</a>
					</div>
				</div>
			</div>
			
			<!-- Middle column: Events upload -->
			<div class="grid-item csv-upload">
				<div class="upload-section">
					<h2>Upload Events</h2>
					<p>Select a CSV file with Time, Topic, and Room columns:</p>
					<input type="file" id="events-upload" accept=".csv,text/csv" />
					<label for="events-upload">Choose File</label>
					<p class="hint">CSV format requires Time, Topic, and Room columns.</p>
					<div class="file-actions">
						<a href="events-sample.csv" download="events-sample.csv" class="download-link">Download Sample CSV</a>
					</div>
				</div>
			</div>
			
			<!-- Right column: Room Capacity upload -->
			<div class="grid-item csv-upload">
				<div class="upload-section">
					<h2>Upload Room Capacity</h2>
					<p>Select a CSV file with Room and Capacity columns:</p>
					<input type="file" id="room-capacity-upload" accept=".csv,text/csv" />
					<label for="room-capacity-upload">Choose File</label>
					<p class="hint">CSV format requires Room and Capacity columns. Capacity must be 1-999.</p>
					<div class="file-actions">
						<a href="room-capacity-sample.csv" download="room-capacity-sample.csv" class="download-link">Download Sample CSV</a>
					</div>
				</div>
			</div>
		</div>
		
		<div class="grid-container grid-container-3col">
			<!-- Left column: Participants display -->
			<div class="grid-item">
				<div id="participant-list" class="data-list">
					<p>No participants loaded. Please upload a CSV file.</p>
				</div>
			</div>
			
			<!-- Middle column: Events display -->
			<div class="grid-item">
				<div id="events-list" class="data-list">
					<p>No events loaded. Please upload a CSV file.</p>
				</div>
			</div>
			
			<!-- Right column: Room Capacity display -->
			<div class="grid-item">
				<div id="room-capacity-list" class="data-list">
					<p>No room capacities loaded. Please upload a CSV file.</p>
				</div>
			</div>
		</div>
	`;

	// Set up all event listeners
	setupEventListeners();
	
	// Initialize button state
	updateDanceCardButton();
};

// Function to set up all event listeners
const setupEventListeners = (): void => {
	// Add event listeners to file inputs
	const participantsInput = document.getElementById('participants-upload');
	if (participantsInput) {
		// @ts-ignore - Browser event type issue
		participantsInput.addEventListener('change', handleParticipantUpload);
	}
	
	const eventsInput = document.getElementById('events-upload');
	if (eventsInput) {
		// @ts-ignore - Browser event type issue
		eventsInput.addEventListener('change', handleEventsUpload);
	}
	
	const roomCapacityInput = document.getElementById('room-capacity-upload');
	if (roomCapacityInput) {
		// @ts-ignore - Browser event type issue
		roomCapacityInput.addEventListener('change', handleRoomCapacityUpload);
	}
	
	// Add event listener to dance card button
	const danceCardButton = document.getElementById('dance-card-button');
	if (danceCardButton) {
		danceCardButton.addEventListener('click', handleDanceCardClick);
	}
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Export functions for testing
export {
	generateDanceCards,
	renderDanceCardTable
};