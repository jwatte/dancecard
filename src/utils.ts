import { ParticipantDanceCard } from './types';

// Function to validate and normalize time formats
export const validateAndNormalizeTime = (timeStr: string): string => {
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

// Function to shuffle an array (Fisher-Yates algorithm)
export const shuffleArray = <T>(array: T[]): T[] => {
	const result = [...array];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
};

// Function to generate CSV content for dance cards
export const generateDanceCardsCSV = (
	danceCards: ParticipantDanceCard[],
	timeSlots: string[]
): string => {
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

	// We do not want the missed topics section here, that's for display only.

	return csvContent;
};
