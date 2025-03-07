// Table display functions for loaded data
import { 
	Participant, 
	Event, 
	RoomCapacity 
} from './types';

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
	table.innerHTML = `
		<thead>
			<tr>
				<th>ID</th>
				<th>Name</th>
			</tr>
		</thead>
		<tbody>
			${participants.map(p => `
				<tr>
					<td>${p.id}</td>
					<td>${p.name}</td>
				</tr>
			`).join('')}
		</tbody>
	`;
	
	// Clear and append both elements
	participantList.innerHTML = '';
	participantList.appendChild(summary);
	participantList.appendChild(table);
	
	// Update dance card button state
	updateButtonCallback();
};

// Function to display events in a table
export const displayEvents = (
	events: Event[],
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
	events.forEach(event => {
		const key = `${event.topic}__${event.room}`;
		if (!topicRoomMap.has(key)) {
			topicRoomMap.set(key, {
				topic: event.topic,
				room: event.room,
				times: []
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
	summary.innerHTML = `<p><strong>${groupedEvents.length}</strong> distinct topic${groupedEvents.length === 1 ? '' : 's'} and room${groupedEvents.length === 1 ? '' : 's'} loaded</p>`;
	
	// Create table for grouped events
	const table = document.createElement('table');
	table.innerHTML = `
		<thead>
			<tr>
				<th>Topic</th>
				<th>Room</th>
				<th>Available Times</th>
			</tr>
		</thead>
		<tbody>
			${groupedEvents.map(group => `
				<tr>
					<td>${group.topic}</td>
					<td>${group.room}</td>
					<td>${group.times.join(', ')}</td>
				</tr>
			`).join('')}
		</tbody>
	`;
	
	// Create a second table for the original event listing by time
	const timeTable = document.createElement('div');
	timeTable.className = 'time-schedule';
	timeTable.innerHTML = `
		<h3>Events by Time</h3>
		<table>
			<thead>
				<tr>
					<th>Time</th>
					<th>Topic</th>
					<th>Room</th>
				</tr>
			</thead>
			<tbody>
				${events.sort((a, b) => a.time.localeCompare(b.time)).map(e => `
					<tr>
						<td>${e.time}</td>
						<td>${e.topic}</td>
						<td>${e.room}</td>
					</tr>
				`).join('')}
			</tbody>
		</table>
	`;
	
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
	summary.innerHTML = `<p><strong>${roomCapacities.length}</strong> room${roomCapacities.length === 1 ? '' : 's'} loaded</p>`;
	
	// Create table for room capacities, sorted by room name
	const table = document.createElement('table');
	table.innerHTML = `
		<thead>
			<tr>
				<th>Room</th>
				<th>Capacity</th>
			</tr>
		</thead>
		<tbody>
			${roomCapacities
				.sort((a, b) => a.room.localeCompare(b.room))
				.map(rc => `
					<tr>
						<td>${rc.room}</td>
						<td>${rc.capacity}</td>
					</tr>
				`).join('')}
		</tbody>
	`;
	
	// Clear and append both elements
	roomCapacityList.innerHTML = '';
	roomCapacityList.appendChild(summary);
	roomCapacityList.appendChild(table);
	
	// Update dance card button state
	updateButtonCallback();
};