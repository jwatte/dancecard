// Main entry point for the Dance Card application

// Define the proper event type for file inputs
// @ts-ignore in some places to support browser API compatibility
type FileInputEvent = {
    target: HTMLInputElement;
}

// Define types for our data
type Participant = {
	id: string;
	name: string;
};

type Event = {
	time: string;
	topic: string;
	room: string;
};

type RoomCapacity = {
	room: string;
	capacity: number;
};

// Type for dance card assignment
type DanceCardAssignment = {
	time: string;
	room: string;
	topic: string;
} | 'FREE';

// Type for participant dance card
type ParticipantDanceCard = {
	participant: Participant;
	assignments: Map<string, DanceCardAssignment>; // time -> assignment
	missedTopics: Set<string>; // topics that could not be visited
};

// Global arrays to store the parsed CSV data
const participants: Participant[] = [];
const events: Event[] = [];
const roomCapacities: RoomCapacity[] = [];

// Data structure for managing dance cards
type DanceCardData = {
	// Maps from room → time → participant[]
	roomsTimesParticipants: Map<string, Map<string, Participant[]>>;
	
	// Maps from participant ID → time → room[]
	participantsTimesRooms: Map<string, Map<string, string[]>>;
};

// Initialize empty data structure
const danceCardData: DanceCardData = {
	roomsTimesParticipants: new Map<string, Map<string, Participant[]>>(),
	participantsTimesRooms: new Map<string, Map<string, string[]>>()
};

// Function to check if both data sets are loaded and enable/disable the dance card button
const updateDanceCardButton = () => {
	const danceCardButton = document.getElementById('dance-card-button') as HTMLButtonElement;
	const buttonHint = document.getElementById('button-hint');
	if (!danceCardButton || !buttonHint) return;
	
	const isEnabled = participants.length > 0 && events.length > 0;
	danceCardButton.disabled = !isEnabled;
	
	// Update button appearance and hint text based on state
	if (isEnabled) {
		danceCardButton.classList.add('button-enabled');
		danceCardButton.classList.remove('button-disabled');
		buttonHint.textContent = 'Press to generate dance cards';
	} else {
		danceCardButton.classList.add('button-disabled');
		danceCardButton.classList.remove('button-enabled');
		buttonHint.textContent = 'Upload both participants and events to enable';
	}
};

// Function to parse participants CSV
const parseParticipantsCSV = (content: string): Participant[] => {
	const lines = content.split('\n');
	const result: Participant[] = [];
	
	// Validate header row (first line)
	const header = lines[0].split(',');
	if (header[0].trim().toLowerCase() !== 'id' || header[1]?.trim().toLowerCase() !== 'name') {
		throw new Error('Participants CSV file must have "ID" and "Name" columns');
	}
	
	// Process data rows (skip header)
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue; // Skip empty lines
		
		const [id, name] = line.split(',');
		if (id && name) {
			result.push({
				id: id.trim(),
				name: name.trim()
			});
		}
	}
	
	return result;
};

// Function to check if CSV content has too many rows (more than 1000 including header)
const checkCsvRowLimit = (content: string): boolean => {
	// Count the number of non-empty rows
	const lines = content.split('\n').filter(line => line.trim().length > 0);
	
	// Check if there are more than 1000 rows (999 data rows + 1 header row)
	if (lines.length > 1000) {
		return false;
	}
	
	return true;
};

// Function to validate and normalize time formats
const validateAndNormalizeTime = (timeStr: string): string => {
	// Trim the input to avoid whitespace issues
	const time = timeStr.trim();
	
	// Pattern for 12-hour format (e.g., "9:30 AM", "10:45 PM")
	// Allow variations like "9:30AM", "9:30 am", etc.
	const twelveHourPattern = /^(\d{1,2}):(\d{2})\s*(am|pm|AM|PM|a\.m\.|p\.m\.|A\.M\.|P\.M\.)$/;
	
	// Pattern for 24-hour format (e.g., "09:30", "14:45")
	const twentyFourHourPattern = /^(\d{1,2}):(\d{2})$/;
	
	let normalizedTime = "";
	
	// Try to match 12-hour format
	const twelveHourMatch = time.match(twelveHourPattern);
	if (twelveHourMatch) {
		let hours = parseInt(twelveHourMatch[1], 10);
		const minutes = parseInt(twelveHourMatch[2], 10);
		const period = twelveHourMatch[3].toLowerCase();
		
		// Validate hours and minutes for 12-hour format
		if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
			throw new Error(`Invalid time format: "${time}". Hours must be 1-12 and minutes must be 0-59 in 12-hour format.`);
		}
		
		// Convert to 24-hour format
		if (period.startsWith('p') && hours < 12) {
			hours += 12;
		} else if (period.startsWith('a') && hours === 12) {
			hours = 0;
		}
		
		// Format hours and minutes to always have 2 digits
		const formattedHours = hours.toString().padStart(2, '0');
		const formattedMinutes = minutes.toString().padStart(2, '0');
		normalizedTime = `${formattedHours}:${formattedMinutes}`;
		return normalizedTime;
	}
	
	// Try to match 24-hour format
	const twentyFourHourMatch = time.match(twentyFourHourPattern);
	if (twentyFourHourMatch) {
		let hours = parseInt(twentyFourHourMatch[1], 10);
		const minutes = parseInt(twentyFourHourMatch[2], 10);
		
		// Validate hours and minutes
		if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
			throw new Error(`Invalid time format: "${time}". Hours must be 0-23 and minutes must be 0-59.`);
		}
		
		// Format hours to always have 2 digits
		const formattedHours = hours.toString().padStart(2, '0');
		const formattedMinutes = minutes.toString().padStart(2, '0');
		normalizedTime = `${formattedHours}:${formattedMinutes}`;
		return normalizedTime;
	}
	
	// If we get here, the time format is invalid
	throw new Error(`Invalid time format: "${time}". Time must be in either "HH:MM" (24-hour) or "HH:MM AM/PM" (12-hour) format.`);
};

// Function to parse events CSV
const parseEventsCSV = (content: string): Event[] => {
	const lines = content.split('\n');
	const result: Event[] = [];
	
	// Validate header row (first line)
	const header = lines[0].split(',');
	if (
		header[0].trim().toLowerCase() !== 'time' || 
		header[1]?.trim().toLowerCase() !== 'topic' || 
		header[2]?.trim().toLowerCase() !== 'room'
	) {
		throw new Error('Events CSV file must have "Time", "Topic", and "Room" columns');
	}
	
	// Process data rows (skip header)
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue; // Skip empty lines
		
		const [timeStr, topic, room] = line.split(',');
		if (timeStr && topic && room) {
			try {
				// Validate and normalize the time format
				const normalizedTime = validateAndNormalizeTime(timeStr);
				
				result.push({
					time: normalizedTime,
					topic: topic.trim(),
					room: room.trim()
				});
			} catch (error) {
				// Add line number to error message for easier identification
				throw new Error(`Error in line ${i + 1}: ${(error as Error).message}`);
			}
		}
	}
	
	return result;
};

// Function to parse room capacity CSV
const parseRoomCapacityCSV = (content: string): RoomCapacity[] => {
	const lines = content.split('\n');
	const result: RoomCapacity[] = [];
	
	// Validate header row (first line)
	const header = lines[0].split(',');
	if (
		header[0].trim().toLowerCase() !== 'room' || 
		header[1]?.trim().toLowerCase() !== 'capacity'
	) {
		throw new Error('Room Capacity CSV file must have "Room" and "Capacity" columns');
	}
	
	// Process data rows (skip header)
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue; // Skip empty lines
		
		const [room, capacityStr] = line.split(',');
		if (room && capacityStr) {
			const capacity = parseInt(capacityStr.trim(), 10);
			
			// Validate capacity
			if (isNaN(capacity)) {
				throw new Error(`Invalid capacity value "${capacityStr}" for room "${room}". Capacity must be a number.`);
			}
			
			if (capacity <= 0 || capacity >= 1000) {
				throw new Error(`Invalid capacity value ${capacity} for room "${room}". Capacity must be greater than 0 and less than 1000.`);
			}
			
			result.push({
				room: room.trim(),
				capacity
			});
		}
	}
	
	return result;
};

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
	
	reader.onload = (e: ProgressEvent<FileReader>) => {
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
			displayParticipants();
			
			// Reset file input
			fileInput.value = '';
		} catch (error) {
			alert(`Error parsing CSV: ${(error as Error).message}`);
		}
	};
	
	reader.readAsText(file);
};

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
	
	reader.onload = (e: ProgressEvent<FileReader>) => {
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
			displayEvents();
			
			// Reset file input
			fileInput.value = '';
		} catch (error) {
			alert(`Error parsing CSV: ${(error as Error).message}`);
		}
	};
	
	reader.readAsText(file);
};

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
	
	reader.onload = (e: ProgressEvent<FileReader>) => {
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
			displayRoomCapacities();
			
			// Reset file input
			fileInput.value = '';
		} catch (error) {
			alert(`Error parsing CSV: ${(error as Error).message}`);
		}
	};
	
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

// Function to display participants
const displayParticipants = () => {
	const participantList = document.getElementById('participant-list');
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
	updateDanceCardButton();
};

// Function to display events
const displayEvents = () => {
	const eventsList = document.getElementById('events-list');
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
	summary.innerHTML = `<p><strong>${groupedEvents.length}</strong> distinct topic${groupedEvents.length === 1 ? '' : 's'} loaded</p>`;
	
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
	updateDanceCardButton();
};

// Function to reset dance card data structures
const resetDanceCardData = () => {
	danceCardData.roomsTimesParticipants.clear();
	danceCardData.participantsTimesRooms.clear();
};

// Function to display room capacities
const displayRoomCapacities = () => {
	const roomCapacityList = document.getElementById('room-capacity-list');
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
	updateDanceCardButton();
};

// Function to shuffle an array (Fisher-Yates algorithm)
const shuffleArray = <T>(array: T[]): T[] => {
	const result = [...array];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
};

// Function to generate dance cards based on the loaded data
const generateDanceCards = (): ParticipantDanceCard[] => {
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
const exportDanceCardsCSV = (danceCards: ParticipantDanceCard[]) => {
	// Get unique time slots sorted chronologically
	const timeSlots = [...new Set(events.map(e => e.time))].sort();
	
	// Create CSV header row
	let csvContent = 'Participant Name,Participant ID';
	
	// Add column for each time slot
	timeSlots.forEach(time => {
		csvContent += `,${time}`;
	});
	csvContent += '\n';
	
	// Add row for each participant
	danceCards.forEach(card => {
		// Add participant info with explicit quoting to preserve leading zeros
		csvContent += `"${card.participant.name}","${card.participant.id}"`;
		
		// Add assignment for each time slot
		timeSlots.forEach(time => {
			const assignment = card.assignments.get(time);
			
			if (assignment === 'FREE') {
				csvContent += ',FREE';
			} else if (assignment) {
				// Escape any commas or quotes in room/topic
				csvContent += `,"${assignment.room} - ${assignment.topic.replace(/"/g, '""')}"`;
			} else {
				csvContent += ',ERROR';
			}
		});
		
		csvContent += '\n';
	});
	
	// Add missed topics section
	const participantsWithMissedTopics = danceCards.filter(card => card.missedTopics.size > 0);
	if (participantsWithMissedTopics.length > 0) {
		csvContent += '\nMissed Topics\n';
		csvContent += 'Participant Name,Participant ID,Missed Topics\n';
		
		// Use the same sorting as the main table (already sorted in danceCards)
		participantsWithMissedTopics.forEach(card => {
			// Include participant ID in the missed topics section too
			csvContent += `"${card.participant.name}","${card.participant.id}","${Array.from(card.missedTopics).sort().join(', ')}"\n`;
		});
	}
	
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
	setTimeout(() => {
		URL.revokeObjectURL(url);
	}, 100);
};

// Function to render dance card table
const renderDanceCardTable = (danceCards: ParticipantDanceCard[]) => {
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
	exportButton.addEventListener('click', () => exportDanceCardsCSV(danceCards));
	
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

// Function to handle dance card button click
const handleDanceCardClick = () => {
	// Reset any existing data
	resetDanceCardData();
	
	// Generate dance cards
	const danceCards = generateDanceCards();
	
	// Render the dance card table
	renderDanceCardTable(danceCards);
};

// Initialize the application
export const initApp = () => {
	const app = document.getElementById('app');
	if (!app) return;
	
	app.innerHTML = `
		<div class="grid-container grid-container-3col">
			<!-- Left column: Participants upload -->
			<div class="grid-item">
				<div class="upload-section">
					<h2>Upload Participants</h2>
					<p>Select a CSV file with ID and Name columns:</p>
					<input type="file" id="participants-upload" accept=".csv,text/csv" />
					<div class="file-actions">
						<a href="/sample.csv" download="sample.csv" class="download-link">Download Sample CSV</a>
					</div>
					<p class="hint">CSV format requires ID and Name columns.</p>
				</div>
			</div>
			
			<!-- Middle column: Events upload -->
			<div class="grid-item">
				<div class="upload-section">
					<h2>Upload Events</h2>
					<p>Select a CSV file with Time, Topic, and Room columns:</p>
					<input type="file" id="events-upload" accept=".csv,text/csv" />
					<div class="file-actions">
						<a href="/events-sample.csv" download="events-sample.csv" class="download-link">Download Sample CSV</a>
					</div>
					<p class="hint">CSV format requires Time, Topic, and Room columns.</p>
				</div>
			</div>
			
			<!-- Right column: Room Capacity upload -->
			<div class="grid-item">
				<div class="upload-section">
					<h2>Upload Room Capacity</h2>
					<p>Select a CSV file with Room and Capacity columns:</p>
					<input type="file" id="room-capacity-upload" accept=".csv,text/csv" />
					<div class="file-actions">
						<a href="/room-capacity-sample.csv" download="room-capacity-sample.csv" class="download-link">Download Sample CSV</a>
					</div>
					<p class="hint">CSV format requires Room and Capacity columns. Capacity must be 1-999.</p>
				</div>
			</div>
		</div>
		
		<!-- Dance Cards button section -->
		<div class="dance-card-container">
			<button id="dance-card-button" class="dance-card-button button-disabled" disabled>Dance Cards</button>
			<p id="button-hint" class="button-hint">Upload both participants and events to enable</p>
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
	
	// Initialize button state
	updateDanceCardButton();
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Export functions for testing
export {
	parseParticipantsCSV,
	parseEventsCSV,
	parseRoomCapacityCSV,
	validateAndNormalizeTime,
	checkCsvRowLimit,
	generateDanceCards,
	renderDanceCardTable
};