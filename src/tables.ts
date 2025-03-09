// Table display functions for loaded data
import {
	createEventsTableHeader,
	createParticipantTableHeader,
	createRoomCapacityTableHeader,
	createTimeScheduleHeader,
} from './templates';
import { EventData, Participant, RoomCapacity } from './types';

// Function to display participants in a table
export const displayParticipants = (
	participants: Participant[],
	participantList: HTMLElement,
	updateButtonCallback: () => void
): void => {
	if (!participantList) return;

	if (participants.length === 0) {
		participantList.innerHTML = '<p>No participants loaded. Please upload a CSV file.</p>';
		return;
	}

	// Create summary element showing count
	const summary = document.createElement('div');
	summary.className = 'data-summary';
	summary.innerHTML = `<p><strong>${participants.length}</strong> participant${participants.length === 1 ? '' : 's'} loaded</p>`;

	// Create table for participants
	const table = document.createElement('table');
	table.innerHTML = createParticipantTableHeader();

	// Create and populate tbody
	const tbody = document.createElement('tbody');
	participants.forEach((participant) => {
		const row = document.createElement('tr');
		row.innerHTML = `
			<td>${participant.id}</td>
			<td>${participant.name}</td>
		`;
		tbody.appendChild(row);
	});
	table.appendChild(tbody);

	// Clear and append both elements
	participantList.innerHTML = '';
	participantList.appendChild(summary);
	participantList.appendChild(table);

	// Update dance card button state
	updateButtonCallback();
};

// Function to display events in a table
export const displayEvents = (
	events: EventData[],
	eventsList: HTMLElement,
	updateButtonCallback: () => void
): void => {
	if (!eventsList) return;

	if (events.length === 0) {
		eventsList.innerHTML = '<p>No events loaded. Please upload a CSV file.</p>';
		return;
	}

	// Create a map to group events by topic and room
	const topicRoomMap = new Map();

	// Group events by topic and room
	events.forEach((event) => {
		const key = `${event.topic}__${event.room}`;
		if (!topicRoomMap.has(key)) {
			topicRoomMap.set(key, {
				topic: event.topic,
				room: event.room,
				times: [],
			});
		}
		topicRoomMap.get(key).times.push(event.time);
	});

	// Convert map to array and sort by topic
	const groupedEvents = Array.from(topicRoomMap.values()).sort((a, b) =>
		a.topic.localeCompare(b.topic)
	);

	// Create summary element showing distinct topics/rooms
	const summary = document.createElement('div');
	summary.className = 'data-summary';
	summary.innerHTML = `<p><strong>${groupedEvents.length}</strong> distinct topic${
		groupedEvents.length === 1 ? '' : 's'
	} and room${groupedEvents.length === 1 ? '' : 's'} loaded</p>`;

	// Create table for grouped events
	const table = document.createElement('table');
	table.innerHTML = createEventsTableHeader();

	// Create and populate tbody for grouped events
	const tbody = document.createElement('tbody');
	groupedEvents.forEach((event) => {
		const row = document.createElement('tr');
		row.innerHTML = `
			<td>${event.topic}</td>
			<td>${event.room}</td>
			<td>${event.times.sort().join(', ')}</td>
		`;
		tbody.appendChild(row);
	});
	table.appendChild(tbody);

	// Create time schedule table
	const timeTable = document.createElement('table');
	timeTable.className = 'time-schedule';
	timeTable.innerHTML = createTimeScheduleHeader();

	// Create and populate tbody for time schedule
	const timeTableBody = document.createElement('tbody');
	events
		.sort((a, b) => a.time.localeCompare(b.time))
		.forEach((event) => {
			const row = document.createElement('tr');
			row.innerHTML = `
			<td>${event.time}</td>
			<td>${event.topic}</td>
			<td>${event.room}</td>
		`;
			timeTableBody.appendChild(row);
		});
	timeTable.appendChild(timeTableBody);

	// Clear and append all elements
	eventsList.innerHTML = '';
	eventsList.appendChild(summary);
	eventsList.appendChild(table);
	eventsList.appendChild(timeTable);

	// Update dance card button state
	updateButtonCallback();
};

// Function to display room capacities in a table
export const displayRoomCapacities = (
	roomCapacities: RoomCapacity[],
	roomCapacityList: HTMLElement,
	updateButtonCallback: () => void
): void => {
	if (!roomCapacityList) return;

	if (roomCapacities.length === 0) {
		roomCapacityList.innerHTML = '<p>No room capacities loaded. Please upload a CSV file.</p>';
		return;
	}

	// Create summary element showing count
	const summary = document.createElement('div');
	summary.className = 'data-summary';
	summary.innerHTML = `<p><strong>${roomCapacities.length}</strong> room${
		roomCapacities.length === 1 ? '' : 's'
	} loaded</p>`;

	// Create table for room capacities, sorted by room name
	const table = document.createElement('table');
	table.innerHTML = createRoomCapacityTableHeader();

	// Create and populate tbody
	const tbody = document.createElement('tbody');
	roomCapacities
		.sort((a, b) => a.room.localeCompare(b.room))
		.forEach((capacity) => {
			const row = document.createElement('tr');
			row.innerHTML = `
			<td>${capacity.room}</td>
			<td>${capacity.capacity}</td>
		`;
			tbody.appendChild(row);
		});
	table.appendChild(tbody);

	// Clear and append both elements
	roomCapacityList.innerHTML = '';
	roomCapacityList.appendChild(summary);
	roomCapacityList.appendChild(table);

	// Update dance card button state
	updateButtonCallback();
};
