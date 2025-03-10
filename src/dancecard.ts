// Dance Card generation functions
import { DanceCardData, EventData, Participant, ParticipantDanceCard, RoomCapacity } from './types';

import { generateDanceCardsCSV, shuffleArray } from './utils';

// Data structure for dance card assignments
const danceCardData: DanceCardData = {
	roomsTimesParticipants: new Map<string, Map<string, Participant[]>>(),
	participantsTimesRooms: new Map<string, Map<string, string[]>>(),
};

// Function to reset dance card data structures
export const resetDanceCardData = (): void => {
	danceCardData.roomsTimesParticipants.clear();
	danceCardData.participantsTimesRooms.clear();
};

type InitialState = {
	participants: Participant[];
	events: EventData[];
	roomCapacities: RoomCapacity[];
};

type PreprocessedState = {
	timeSlots: string[];
	allTopics: string[];
	timeRoomTopicMap: Map<string, Map<string, string>>;
};

type AssignmentState = {
	participantStates: ParticipantState[];
	roomStates: RoomState[];
	timeRoomTopicMap: Map<string, Map<string, string>>;
	timeSlots: string[];
};

type FinalState = {
	danceCards: ParticipantDanceCard[];
};

type ParticipantState = {
	participant: Participant;
	unvisitedTopics: Set<string>;
	assignments: Map<string, string>;
};

type RoomState = {
	room: string;
	capacity: number;
	attendees: Map<string, Set<Participant>>;
};

type AnnealingEntry = {
	participantState: ParticipantState;
	missedTopicCount: number;
};

type AnnealingResult = {
	requeue: boolean;
	entry: AnnealingEntry;
};

type DanceCardAssignment =
	| {
			time: string;
			room: string;
			topic: string;
	  }
	| 'FREE';

const createFreeAssignment = (): 'FREE' => 'FREE';

const createRoomAssignment = (
	time: string,
	room: string,
	topic: string | undefined
): DanceCardAssignment => {
	if (!topic) {
		return 'FREE';
	}
	return {
		time,
		room,
		topic,
	};
};

const getAssignmentForTimeSlot = (
	time: string,
	roomAssignment: string | undefined,
	timeRoomTopicMap: Map<string, Map<string, string>>
): DanceCardAssignment => {
	if (!roomAssignment || roomAssignment === 'FREE') {
		return createFreeAssignment();
	}

	const topic = timeRoomTopicMap.get(time)?.get(roomAssignment);
	return createRoomAssignment(time, roomAssignment, topic);
};

export const generateDanceCards = (
	participants: Participant[],
	events: EventData[],
	roomCapacities: RoomCapacity[]
): ParticipantDanceCard[] => {
	const initialState: InitialState = { participants, events, roomCapacities };

	const preprocessed = preprocessData(initialState);
	const setupState = setupAssignmentState(initialState, preprocessed);
	const firstPhaseState = performFirstAssignmentPhase(setupState);
	const annealedState = performAnnealingPhase(firstPhaseState);
	const finalState = convertToFinalFormat(annealedState);

	return finalState.danceCards;
};

export const preprocessData = (state: InitialState): PreprocessedState => {
	const timeSlots = [...new Set(state.events.map((e) => e.time))].sort();
	const allTopics = [...new Set(state.events.map((e) => e.topic))];

	const timeRoomTopicMap = new Map<string, Map<string, string>>();
	state.events.forEach((event) => {
		if (!timeRoomTopicMap.has(event.time)) {
			timeRoomTopicMap.set(event.time, new Map());
		}
		timeRoomTopicMap.get(event.time)!.set(event.room, event.topic);
	});

	return { timeSlots, allTopics, timeRoomTopicMap };
};

export const setupAssignmentState = (
	initial: InitialState,
	preprocessed: PreprocessedState
): AssignmentState => {
	const participantStates = initial.participants.map((p) => ({
		participant: p,
		unvisitedTopics: new Set(preprocessed.allTopics),
		assignments: new Map<string, string>(),
	}));

	const roomStates = initial.roomCapacities.map((rc) => ({
		room: rc.room,
		capacity: rc.capacity,
		attendees: new Map(preprocessed.timeSlots.map((time) => [time, new Set<Participant>()])),
	}));

	return {
		participantStates,
		roomStates,
		timeRoomTopicMap: preprocessed.timeRoomTopicMap,
		timeSlots: preprocessed.timeSlots,
	};
};

export const performFirstAssignmentPhase = (state: AssignmentState): AssignmentState => {
	const newState = structuredClone(state);

	// Process participants time slot by time slot
	for (const time of newState.timeSlots) {
		// Sort participants by number of unassigned topics (descending) and then by ID
		newState.participantStates.sort((a, b) => {
			const topicDiff = b.unvisitedTopics.size - a.unvisitedTopics.size;
			return topicDiff !== 0 ? topicDiff : a.participant.id.localeCompare(b.participant.id);
		});

		for (const pState of newState.participantStates) {
			if (pState.assignments.has(time)) continue;

			const unvisitedTopics = Array.from(pState.unvisitedTopics);
			shuffleArray(unvisitedTopics);

			assignParticipantToRoom(pState, time, unvisitedTopics, newState);
		}
	}

	return newState;
};

export const performAnnealingPhase = (state: AssignmentState): AssignmentState => {
	const newState = structuredClone(state);
	let annealingQueue = initializeAnnealingQueue(newState.participantStates);

	const MAX_ITERATIONS = 20000;
	let iterations = 0;

	while (annealingQueue.length > 0 && iterations < MAX_ITERATIONS) {
		iterations++;
		const result = annealUnusedParticipantSlot(annealingQueue.shift()!, newState);
		if (result.requeue) {
			annealingQueue.push(result.entry);
		}
	}

	if (iterations >= MAX_ITERATIONS) {
		console.warn(`Annealing phase reached maximum iterations (${MAX_ITERATIONS})`);
	}

	return newState;
};

export const convertToFinalFormat = (state: AssignmentState): FinalState => {
	const danceCards = state.participantStates.map((pState) => ({
		participant: pState.participant,
		assignments: createAssignmentsMap(pState, state),
		missedTopics: pState.unvisitedTopics,
	}));

	danceCards.sort((a, b) => {
		const nameComparison = a.participant.name.localeCompare(b.participant.name);
		return nameComparison !== 0
			? nameComparison
			: a.participant.id.localeCompare(b.participant.id);
	});

	return { danceCards };
};

const assignParticipantToRoom = (
	pState: ParticipantState,
	time: string,
	unvisitedTopics: string[],
	state: AssignmentState
): void => {
	// Try each unvisited topic
	for (const topic of unvisitedTopics) {
		// Find rooms offering this topic at this time
		const availableRooms = findRoomsWithTopic(topic, time, state.timeRoomTopicMap);

		// Try each room that offers this topic
		for (const room of availableRooms) {
			const roomState = state.roomStates.find((rs) => rs.room === room);
			if (!roomState) {
				continue;
			}
			// Check if room has capacity
			const currentAttendees = roomState.attendees.get(time);
			if (currentAttendees && currentAttendees.size < roomState.capacity) {
				// Assign participant to room
				pState.assignments.set(time, room);
				pState.unvisitedTopics.delete(topic);
				currentAttendees.add(pState.participant);
				return;
			}
		}
	}

	// If no assignment was possible, mark as FREE
	pState.assignments.set(time, 'FREE');
};

const findRoomsWithTopic = (
	topic: string,
	time: string,
	timeRoomTopicMap: Map<string, Map<string, string>>
): string[] => {
	const rooms: string[] = [];
	const roomTopicMap = timeRoomTopicMap.get(time);

	if (roomTopicMap) {
		for (const [room, roomTopic] of roomTopicMap.entries()) {
			if (roomTopic === topic) {
				rooms.push(room);
			}
		}
	}

	return shuffleArray(rooms); // Randomize room order for better distribution
};

const initializeAnnealingQueue = (participantStates: ParticipantState[]): AnnealingEntry[] => {
	// Create entries for participants with missed topics
	const entries = participantStates
		.map((pState) => ({
			participantState: pState,
			missedTopicCount: pState.unvisitedTopics.size,
		}))
		.filter((entry) => entry.missedTopicCount > 0);

	// Sort by number of missed topics (descending)
	entries.sort((a, b) => b.missedTopicCount - a.missedTopicCount);

	return entries;
};

const removeParticipantFromRoom = (
	pState: ParticipantState,
	time: string,
	currentRoom: string,
	state: AssignmentState
): boolean => {
	const roomState = state.roomStates.find((rs) => rs.room === currentRoom);
	if (roomState) {
		const attendees = roomState.attendees.get(time);
		if (attendees) {
			attendees.delete(pState.participant);
			pState.assignments.set(time, 'FREE');
			return true;
		}
	}
	return false;
};

const tryReassignment = (
	pState: ParticipantState,
	time: string,
	state: AssignmentState
): AnnealingResult | undefined => {
	for (const topic of pState.unvisitedTopics) {
		const availableRoom = findRoomsWithTopic(topic, time, state.timeRoomTopicMap)[0];
		const room = state.roomStates.find((rs) => rs.room === availableRoom);
		if (!room) {
			continue;
		}
		const attendeesAtTime = room.attendees.get(time);
		if (attendeesAtTime?.size! >= room.capacity) {
			// remove a victim
			const victim = attendeesAtTime!.values().next().value!;
			const victimState = state.participantStates.find(
				(ps) => ps.participant.id === victim.id
			);
			if (!victimState) {
				console.log(
					`Could not find other user state in room ${availableRoom} at ${time} for id ${victim.id}`
				);
				continue;
			}
			if (removeParticipantFromRoom(victimState, time, availableRoom, state)) {
				attendeesAtTime!.add(pState.participant);
				pState.assignments.set(time, availableRoom);
				pState.unvisitedTopics.delete(topic);
				return {
					requeue: true,
					entry: {
						participantState: victimState,
						missedTopicCount: victimState.unvisitedTopics.size,
					},
				};
			}
		}
	}
};

const annealUnusedParticipantSlot = (
	entry: AnnealingEntry,
	state: AssignmentState
): AnnealingResult => {
	const pState = entry.participantState;
	const initialMissedCount = pState.unvisitedTopics.size;

	// Process each time slot
	for (const time of state.timeSlots) {
		const currentRoom = pState.assignments.get(time);
		if (currentRoom !== 'FREE') continue;
		const newEntry = tryReassignment(pState, time, state);
	}
	// found no victim to swap with
	return {
		requeue: false,
		entry,
	};
};

const createAssignmentsMap = (
	pState: ParticipantState,
	state: AssignmentState
): Map<string, DanceCardAssignment> => {
	const assignments = new Map<string, DanceCardAssignment>();

	state.timeSlots.forEach((time) => {
		const roomAssignment = pState.assignments.get(time);
		const assignment = getAssignmentForTimeSlot(time, roomAssignment, state.timeRoomTopicMap);
		assignments.set(time, assignment);
	});

	return assignments;
};

// Function to export dance cards as CSV
export const exportDanceCardsCSV = (
	danceCards: ParticipantDanceCard[],
	events: EventData[]
): void => {
	// Get unique time slots sorted chronologically
	const timeSlots = [...new Set(events.map((e) => e.time))].sort();

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
const createHeaderRow = (timeSlots: string[]): string => {
	let headerRow = '<tr><th>Participant Name</th><th>Participant ID</th>';
	timeSlots.forEach((time) => {
		headerRow += `<th>${time}</th>`;
	});
	headerRow += '</tr>';
	return headerRow;
};

const createAssignmentCell = (assignment: DanceCardAssignment): string => {
	if (assignment === 'FREE') {
		return '<td class="free-slot">FREE</td>';
	}

	return `<td class="assigned-slot">
		${assignment.room}<br>
		<span class="topic">${assignment.topic}</span>
	</td>`;
};

const createParticipantRow = (
	card: ParticipantDanceCard,
	timeSlots: string[]
): HTMLTableRowElement => {
	const row = document.createElement('tr');

	// Add participant info
	row.innerHTML = `
		<td>${card.participant.name}</td>
		<td>${card.participant.id}</td>
	`;

	// Add assignments
	timeSlots.forEach((time) => {
		const assignment = card.assignments.get(time);
		if (!assignment) {
			row.innerHTML += '<td class="error-slot">ERROR</td>';
			return;
		}
		row.innerHTML += createAssignmentCell(assignment);
	});

	return row;
};

const createMissedTopicsTable = (
	participantsWithMissedTopics: ParticipantDanceCard[]
): HTMLDivElement => {
	const container = document.createElement('div');
	container.className = 'missed-topics-container';
	container.innerHTML = '<h3>Missed Topics</h3>';

	const tableContainer = document.createElement('div');
	tableContainer.className = 'table-container';

	const table = document.createElement('table');
	table.className = 'missed-topics-table';
	table.innerHTML = `
		<thead>
			<tr>
				<th>Participant Name</th>
				<th>Participant ID</th>
				<th>Missed Topics</th>
			</tr>
		</thead>
		<tbody>
			${participantsWithMissedTopics
				.map(
					(card) => `
				<tr>
					<td>${card.participant.name}</td>
					<td>${card.participant.id}</td>
					<td>${Array.from(card.missedTopics).sort().join(', ')}</td>
				</tr>
			`
				)
				.join('')}
		</tbody>
	`;

	tableContainer.appendChild(table);
	container.appendChild(tableContainer);
	return container;
};

const createExportButton = (
	danceCards: ParticipantDanceCard[],
	events: EventData[]
): HTMLButtonElement => {
	const exportButton = document.createElement('button');
	exportButton.className = 'export-button';
	exportButton.textContent = 'Export CSV';
	exportButton.addEventListener('click', () => exportDanceCardsCSV(danceCards, events));
	return exportButton;
};

const createHeaderContainer = (
	danceCards: ParticipantDanceCard[],
	events: EventData[]
): HTMLDivElement => {
	const headerContainer = document.createElement('div');
	headerContainer.className = 'results-header';

	const heading = document.createElement('h2');
	heading.textContent = 'Generated Dance Cards';

	headerContainer.appendChild(heading);
	headerContainer.appendChild(createExportButton(danceCards, events));
	return headerContainer;
};

export const renderDanceCardTable = (
	danceCards: ParticipantDanceCard[],
	events: EventData[]
): void => {
	const danceCardContainer = document.querySelector('#dance-card-container');
	if (!danceCardContainer) {
		console.error('Dance card container not found');
		return;
	}

	const timeSlots = [...new Set(events.map((e) => e.time))].sort();

	// Create main container
	const resultsContainer = document.createElement('div');
	resultsContainer.className = 'dance-card-results';

	// Add header with export button
	resultsContainer.appendChild(createHeaderContainer(danceCards, events));

	// Create table container
	const tableContainer = document.createElement('div');
	tableContainer.className = 'table-container';

	// Create main table
	const table = document.createElement('table');
	table.className = 'dance-card-table';

	// Add header
	const thead = document.createElement('thead');
	thead.innerHTML = createHeaderRow(timeSlots);
	table.appendChild(thead);

	// Add body
	const tbody = document.createElement('tbody');
	danceCards.forEach((card) => {
		tbody.appendChild(createParticipantRow(card, timeSlots));
	});
	table.appendChild(tbody);

	// Assemble table structure
	tableContainer.appendChild(table);
	resultsContainer.appendChild(tableContainer);

	// Add missed topics if any
	const participantsWithMissedTopics = danceCards.filter((card) => card.missedTopics.size > 0);
	if (participantsWithMissedTopics.length > 0) {
		resultsContainer.appendChild(createMissedTopicsTable(participantsWithMissedTopics));
	}

	// Clear container while preserving the button
	danceCardContainer.querySelector('.dance-card-results')?.remove();
	danceCardContainer.appendChild(resultsContainer);
};
