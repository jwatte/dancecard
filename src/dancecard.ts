// Dance Card generation functions
import { 
	Participant, 
	Event, 
	RoomCapacity, 
	DanceCardAssignment, 
	ParticipantDanceCard, 
	DanceCardData 
} from './types';

import {
	shuffleArray,
	generateDanceCardsCSV
} from './utils';

// Data structure for dance card assignments
const danceCardData: DanceCardData = {
	roomsTimesParticipants: new Map<string, Map<string, Participant[]>>(),
	participantsTimesRooms: new Map<string, Map<string, string[]>>()
};

// Function to reset dance card data structures
export const resetDanceCardData = (): void => {
	danceCardData.roomsTimesParticipants.clear();
	danceCardData.participantsTimesRooms.clear();
};

// Function to generate dance cards based on the loaded data
export const generateDanceCards = (participants: Participant[], events: Event[], roomCapacities: RoomCapacity[]): ParticipantDanceCard[] => {
	// Map to track room occupancy at each time slot
	const roomOccupancy: Map<string, Map<string, number>> = new Map(); // time -> room -> current occupancy
	
	// Initialize room occupancy tracking
	events.forEach(event => {
		if (!roomOccupancy.has(event.time)) {
			roomOccupancy.set(event.time, new Map());
		}
		roomOccupancy.get(event.time)!.set(event.room, 0);
	});
	
	// Get room capacities for quick lookup
	const roomCapacityMap = new Map<string, number>();
	roomCapacities.forEach(rc => {
		roomCapacityMap.set(rc.room, rc.capacity);
	});
	
	// Get unique time slots sorted chronologically
	const timeSlots = [...new Set(events.map(e => e.time))].sort();
	
	// Create a map of time -> room -> topic for quick lookup
	const timeRoomTopicMap = new Map<string, Map<string, string>>();
	events.forEach(event => {
		if (!timeRoomTopicMap.has(event.time)) {
			timeRoomTopicMap.set(event.time, new Map());
		}
		timeRoomTopicMap.get(event.time)!.set(event.room, event.topic);
	});
	
	// Get a list of all unique topics
	const allTopics = [...new Set(events.map(e => e.topic))];
	
	// Initialize dance cards for all participants
	const danceCards: ParticipantDanceCard[] = participants.map(participant => ({
		participant,
		assignments: new Map<string, DanceCardAssignment>(),
		missedTopics: new Set<string>()
	}));
	
	// Shuffle the participants before assigning to prevent ordering bias
	const shuffledDanceCards = shuffleArray(danceCards);
	
	// For each participant, try to assign them to rooms for each time slot
	shuffledDanceCards.forEach(danceCard => {
		// Track topics this participant has already seen
		const seenTopics = new Set<string>();
		
		// Process each time slot
		for (const time of timeSlots) {
			// Get rooms available at this time
			const roomsAtTime = timeRoomTopicMap.get(time);
			if (!roomsAtTime) continue;
			
			// Find a room with an available topic the participant hasn't seen yet
			let assigned = false;
			
			// Create a list of available topic/room options
			const availableOptions = Array.from(roomsAtTime.entries())
				.filter(([room]) => {
					// Ensure the room exists in our capacity data
					return roomCapacityMap.has(room);
				})
				.filter(([room, topic]) => {
					// Only include topics this participant hasn't seen yet
					return !seenTopics.has(topic);
				})
				.filter(([room]) => {
					// Ensure the room has capacity
					const currentOccupancy = roomOccupancy.get(time)?.get(room) || 0;
					const capacity = roomCapacityMap.get(room) || 0;
					return currentOccupancy < capacity;
				});
			
			// Shuffle the options to randomize the assignment
			const shuffledOptions = shuffleArray(availableOptions);
			
			// Try to assign from the shuffled options
			if (shuffledOptions.length > 0) {
				const [room, topic] = shuffledOptions[0];
				
				// Assign participant to this room
				danceCard.assignments.set(time, {
					time,
					room,
					topic
				});
				
				// Mark topic as seen
				seenTopics.add(topic);
				
				// Update room occupancy
				const currentOccupancy = roomOccupancy.get(time)?.get(room) || 0;
				roomOccupancy.get(time)!.set(room, currentOccupancy + 1);
				
				assigned = true;
			}
			
			// If no assignment was possible, mark as FREE
			if (!assigned) {
				danceCard.assignments.set(time, 'FREE');
			}
		}
		
		// Record topics that the participant couldn't visit
		allTopics.forEach(topic => {
			if (!seenTopics.has(topic)) {
				danceCard.missedTopics.add(topic);
			}
		});
	});
	
	// Sort the dance cards first by participant name, then by participant ID
	shuffledDanceCards.sort((a, b) => {
		// First sort by name
		const nameComparison = a.participant.name.localeCompare(b.participant.name);
		if (nameComparison !== 0) {
			return nameComparison;
		}
		// If names are the same, sort by ID
		return a.participant.id.localeCompare(b.participant.id);
	});
	
	return shuffledDanceCards;
};

// Function to export dance cards as CSV
export const exportDanceCardsCSV = (danceCards: ParticipantDanceCard[], events: Event[]): void => {
	// Get unique time slots sorted chronologically
	const timeSlots = [...new Set(events.map(e => e.time))].sort();
	
	// Generate CSV content
	const csvContent = generateDanceCardsCSV(danceCards, timeSlots);
	
	// Create a blob with the CSV content
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	
	// Create a download link and trigger a click
	const link = document.createElement('a');
	const url = URL.createObjectURL(blob);
	
	link.setAttribute('href', url);
	link.setAttribute('download', 'dance_cards.csv');
	link.style.display = 'none';
	
	document.body.appendChild(link);
	link.click();
	
	// Cleanup
	document.body.removeChild(link);
	function cleanupURL() { 
		URL.revokeObjectURL(url); 
	}
	setTimeout(cleanupURL, 100);
};

// Function to render dance card table
export const renderDanceCardTable = (danceCards: ParticipantDanceCard[], events: Event[]): void => {
	// Get container element
	const danceCardContainer = document.querySelector('.dance-card-container');
	if (!danceCardContainer) return;
	
	// Get unique time slots sorted chronologically
	const timeSlots = [...new Set(events.map(e => e.time))].sort();
	
	// Create dance card results container
	const resultsContainer = document.createElement('div');
	resultsContainer.className = 'dance-card-results';
	
	// Create header with export button
	const headerContainer = document.createElement('div');
	headerContainer.className = 'results-header';
	
	const heading = document.createElement('h2');
	heading.textContent = 'Generated Dance Cards';
	
	const exportButton = document.createElement('button');
	exportButton.className = 'export-button';
	exportButton.textContent = 'Export CSV';
	exportButton.addEventListener('click', function() { exportDanceCardsCSV(danceCards, events); });
	
	headerContainer.appendChild(heading);
	headerContainer.appendChild(exportButton);
	resultsContainer.appendChild(headerContainer);
	
	// Create a container for the table that will enable scrolling
	const tableContainer = document.createElement('div');
	tableContainer.className = 'table-container';
	
	// Create dance card table
	const table = document.createElement('table');
	table.className = 'dance-card-table';
	
	// Create table header
	const thead = document.createElement('thead');
	let headerRow = '<tr><th>Participant Name</th><th>Participant ID</th>';
	
	// Add column for each time slot
	timeSlots.forEach(time => {
		headerRow += `<th>${time}</th>`;
	});
	
	headerRow += '</tr>';
	thead.innerHTML = headerRow;
	table.appendChild(thead);
	
	// Create table body
	const tbody = document.createElement('tbody');
	
	// Add row for each participant
	danceCards.forEach(card => {
		const row = document.createElement('tr');
		
		// Add participant info
		row.innerHTML = `
			<td>${card.participant.name}</td>
			<td>${card.participant.id}</td>
		`;
		
		// Add assignment for each time slot
		timeSlots.forEach(time => {
			const assignment = card.assignments.get(time);
			
			if (assignment === 'FREE') {
				row.innerHTML += '<td class="free-slot">FREE</td>';
			} else if (assignment) {
				row.innerHTML += `<td class="assigned-slot">
					${assignment.room}<br>
					<span class="topic">${assignment.topic}</span>
				</td>`;
			} else {
				row.innerHTML += '<td class="error-slot">ERROR</td>';
			}
		});
		
		tbody.appendChild(row);
	});
	
	table.appendChild(tbody);
	tableContainer.appendChild(table);
	resultsContainer.appendChild(tableContainer);
	
	// Add missed topics summary if any
	const participantsWithMissedTopics = danceCards.filter(card => card.missedTopics.size > 0);
	if (participantsWithMissedTopics.length > 0) {
		const missedTopicsContainer = document.createElement('div');
		missedTopicsContainer.className = 'missed-topics-container';
		missedTopicsContainer.innerHTML = '<h3>Missed Topics</h3>';
		
		// Create container for the missed topics table to enable scrolling
		const missedTableContainer = document.createElement('div');
		missedTableContainer.className = 'table-container';
		
		const missedTable = document.createElement('table');
		missedTable.className = 'missed-topics-table';
		missedTable.innerHTML = `
			<thead>
				<tr>
					<th>Participant Name</th>
					<th>Participant ID</th>
					<th>Missed Topics</th>
				</tr>
			</thead>
			<tbody>
				${participantsWithMissedTopics.map(card => `
					<tr>
						<td>${card.participant.name}</td>
						<td>${card.participant.id}</td>
						<td>${Array.from(card.missedTopics).sort().join(', ')}</td>
					</tr>
				`).join('')}
			</tbody>
		`;
		
		missedTableContainer.appendChild(missedTable);
		missedTopicsContainer.appendChild(missedTableContainer);
		resultsContainer.appendChild(missedTopicsContainer);
	}
	
	// Remove any existing dance card results
	const existingResults = document.querySelector('.dance-card-results');
	if (existingResults) {
		existingResults.remove();
	}
	
	// Add the new results below the dance card button
	danceCardContainer.appendChild(resultsContainer);
};