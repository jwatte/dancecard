import { Participant, Event, RoomCapacity } from './types';
import { validateAndNormalizeTime } from './utils';

// Function to check if CSV content has too many rows (more than 1000 including header)
export const checkCsvRowLimit = (content: string): boolean => {
	// Count the number of non-empty rows
	const lines = content.split('\n').filter(line => line.trim().length > 0);
	
	// Check if there are more than 1000 rows (999 data rows + 1 header row)
	if (lines.length > 1000) {
		return false;
	}
	
	return true;
};

// Function to parse participants CSV
export const parseParticipantsCSV = (content: string): Participant[] => {
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

// Function to parse events CSV
export const parseEventsCSV = (content: string): Event[] => {
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
export const parseRoomCapacityCSV = (content: string): RoomCapacity[] => {
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