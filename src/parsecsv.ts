import { EventData, Participant, RoomCapacity } from './types';
import { validateAndNormalizeTime } from './utils';

export interface ParsedCSV {
	indices: { [key: string]: number };
	rows: string[][];
}

const parseCSVRow = (row: string): string[] => {
	const result: string[] = [];
	let currentField = '';
	let inQuotes = false;
	let i = 0;

	while (i < row.length) {
		const char = row[i];

		if (char === '"') {
			if (inQuotes) {
				// Check for escaped quote (double quote)
				if (i + 1 < row.length && row[i + 1] === '"') {
					currentField += '"';
					i += 2;
					continue;
				}
				// End of quoted field
				inQuotes = false;
				i++;
				continue;
			} else {
				// Start of quoted field
				if (currentField.trim().length === 0) {
					inQuotes = true;
					i++;
					continue;
				} else {
					throw new Error('Invalid quote in the middle of field');
				}
			}
		}

		if (char === ',' && !inQuotes) {
			result.push(currentField.trim());
			currentField = '';
			i++;
			continue;
		}

		currentField += char;
		i++;
	}

	// Handle the last field
	if (inQuotes) {
		throw new Error('Unclosed quote');
	}
	result.push(currentField.trim());

	return result;
};

export const parseCSVGeneric = (content: string): ParsedCSV => {
	if (content.trim().length === 0) {
		throw new Error('CSV file is empty');
	}

	let currentRow = '';
	let rows: string[] = [];
	let inQuotes = false;

	// First pass: split into rows while respecting quotes
	for (let i = 0; i < content.length; i++) {
		const char = content[i];

		if (char === '"') {
			if (inQuotes && i + 1 < content.length && content[i + 1] === '"') {
				// Handle escaped quotes
				currentRow += char;
				i++; // Skip next quote
			} else {
				inQuotes = !inQuotes;
			}
			currentRow += char;
		} else if (char === '\n' && !inQuotes) {
			if (currentRow.trim().length > 0) {
				rows.push(currentRow);
			}
			currentRow = '';
		} else {
			currentRow += char;
		}
	}

	// Add the last row if not empty
	if (currentRow.trim().length > 0) {
		rows.push(currentRow);
	}

	if (rows.length === 0) {
		throw new Error('CSV file is empty');
	}

	// Parse header and create indices map
	const headerRow = parseCSVRow(rows[0]);
	const indices: { [key: string]: number } = {};
	headerRow.forEach((header, index) => {
		if (header) {
			indices[header.toLowerCase()] = index;
		}
	});

	// Parse data rows
	const parsedRows = rows.slice(1).map((row) => parseCSVRow(row));

	return { indices, rows: parsedRows };
};

// Function to check if CSV content has too many rows (more than 1000 including header)
export const checkCsvRowLimit = (content: string): boolean => {
	// Count the number of non-empty rows
	const lines = content.split('\n').filter((line) => line.trim().length > 0);

	// Check if there are more than 1000 rows (999 data rows + 1 header row)
	if (lines.length > 1000) {
		return false;
	}

	return true;
};

// Function to parse participants CSV
export const parseParticipantsCSV = (content: string): Participant[] => {
	const { indices, rows } = parseCSVGeneric(content);

	// Validate required columns exist
	if (!('id' in indices) || !('name' in indices)) {
		throw new Error('Participants CSV file must have "ID" and "Name" columns');
	}

	const result: Participant[] = [];
	rows.forEach((row, i) => {
		// Check if the indices are within bounds of the row array
		if (indices.id >= row.length || indices.name >= row.length) {
			throw new Error(`Line ${i + 2}: Missing required fields (ID, Name)`);
		}

		const id = row[indices.id];
		const name = row[indices.name];

		result.push({
			id: id.trim(),
			name: name.trim(),
		});
	});

	return result;
};

// Function to parse events CSV
export const parseEventsCSV = (content: string): EventData[] => {
	const { indices, rows } = parseCSVGeneric(content);

	// Validate required columns exist
	if (!('time' in indices) || !('topic' in indices) || !('room' in indices)) {
		throw new Error('Events CSV file must have "Time", "Topic", and "Room" columns');
	}

	const result: EventData[] = [];
	const roomTimeMap = new Map<string, Set<string>>();

	rows.forEach((row, i) => {
		// Check if the indices are within bounds of the row array
		if (
			indices.time >= row.length ||
			indices.topic >= row.length ||
			indices.room >= row.length
		) {
			throw new Error(`Line ${i + 2}: Missing required fields (Time, Topic, Room)`);
		}

		const timeStr = row[indices.time];
		const topic = row[indices.topic];
		const room = row[indices.room];

		try {
			const normalizedTime = validateAndNormalizeTime(timeStr);
			const roomKey = room.trim();

			// Check for room-time conflicts
			if (!roomTimeMap.has(roomKey)) {
				roomTimeMap.set(roomKey, new Set());
			}
			const timeSet = roomTimeMap.get(roomKey)!;
			if (timeSet.has(normalizedTime)) {
				throw new Error(
					`Room "${roomKey}" is already scheduled for time ${normalizedTime}`
				);
			}
			timeSet.add(normalizedTime);

			result.push({
				time: normalizedTime,
				topic: topic.trim(),
				room: roomKey,
			});
		} catch (error) {
			throw new Error(`Line ${i + 2}: ${(error as Error).message}`);
		}
	});

	return result;
};

// Function to parse room capacity CSV
export const parseRoomCapacityCSV = (content: string): RoomCapacity[] => {
	const { indices, rows } = parseCSVGeneric(content);

	// Validate required columns exist
	if (!('room' in indices) || !('capacity' in indices)) {
		throw new Error('Room Capacity CSV file must have "Room" and "Capacity" columns');
	}

	const result: RoomCapacity[] = [];
	rows.forEach((row, i) => {
		// Check if the indices are within bounds of the row array
		if (indices.room >= row.length || indices.capacity >= row.length) {
			throw new Error(`Line ${i + 2}: Missing required fields (Room, Capacity)`);
		}

		const room = row[indices.room];
		const capacityStr = row[indices.capacity];

		// Empty capacity is now allowed
		if (capacityStr.trim().length === 0) {
			return;
		}

		const capacity = parseInt(capacityStr.trim(), 10);

		if (isNaN(capacity)) {
			throw new Error(
				`Line ${i + 2}: Invalid capacity value "${capacityStr}" for room "${room}". Capacity must be a number.`
			);
		}

		if (capacity <= 0 || capacity >= 1000) {
			throw new Error(
				`Line ${i + 2}: Invalid capacity value ${capacity} for room "${room}". Capacity must be greater than 0 and less than 1000.`
			);
		}

		result.push({
			room: room.trim(),
			capacity,
		});
	});

	return result;
};
