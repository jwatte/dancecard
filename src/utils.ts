import { ParticipantDanceCard } from './types';

type TimeMatch = {
	hours: number;
	minutes: number;
	period?: string;
};

const validateMinutes = (minutes: number): void => {
	if (minutes < 0 || minutes > 59) {
		throw new Error(`Invalid minutes: ${minutes}. Minutes must be between 0 and 59.`);
	}
};

const validate24HourFormat = (hours: number): void => {
	if (hours < 0 || hours > 23) {
		throw new Error(
			`Invalid hours: ${hours}. Hours must be between 0 and 23 in 24-hour format.`
		);
	}
};

const validate12HourFormat = (hours: number): void => {
	if (hours < 1 || hours > 12) {
		throw new Error(
			`Invalid hours: ${hours}. Hours must be between 1 and 12 in 12-hour format.`
		);
	}
};

// Function to parse and validate time components
const parseTimeComponents = (match: RegExpMatchArray, is24Hour: boolean): TimeMatch => {
	const hours = parseInt(match[1], 10);
	const minutes = parseInt(match[2], 10);
	const period = !is24Hour ? match[3].toLowerCase() : undefined;

	validateMinutes(minutes);

	if (is24Hour) {
		validate24HourFormat(hours);
	} else {
		validate12HourFormat(hours);
	}

	return { hours, minutes, period };
};

// Function to convert 12-hour time to 24-hour format
const convertTo24Hour = ({ hours, minutes, period }: TimeMatch): TimeMatch => {
	if (!period) return { hours, minutes };

	let adjustedHours = hours;
	if (period.startsWith('p') && hours < 12) {
		adjustedHours += 12;
	} else if (period.startsWith('a') && hours === 12) {
		adjustedHours = 0;
	}

	return { hours: adjustedHours, minutes };
};

// Function to format time components to standard format
const formatTime = ({ hours, minutes }: TimeMatch): string => {
	const formattedHours = hours.toString().padStart(2, '0');
	const formattedMinutes = minutes.toString().padStart(2, '0');
	return `${formattedHours}:${formattedMinutes}`;
};

// Main time validation and normalization function
export const validateAndNormalizeTime = (timeStr: string): string => {
	const time = timeStr.trim();
	const timePatterns = {
		twelveHour: /^(\d{1,2}):(\d{2})\s*(am|pm|AM|PM|a\.m\.|p\.m\.|A\.M\.|P\.M\.)$/,
		twentyFourHour: /^(\d{1,2}):(\d{2})$/,
	};

	const twelveHourMatch = time.match(timePatterns.twelveHour);
	if (twelveHourMatch) {
		const components = parseTimeComponents(twelveHourMatch, false);
		const converted = convertTo24Hour(components);
		return formatTime(converted);
	}

	const twentyFourHourMatch = time.match(timePatterns.twentyFourHour);
	if (twentyFourHourMatch) {
		const components = parseTimeComponents(twentyFourHourMatch, true);
		return formatTime(components);
	}

	throw new Error(
		`Invalid time format: "${time}". Time must be in either "HH:MM" (24-hour) or "HH:MM AM/PM" (12-hour) format.`
	);
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
	const csvHeader = ['Participant Name', 'Participant ID', ...timeSlots];
	const csvRows = danceCards.map((card) => {
		const participantInfo = [`"${card.participant.name}"`, `"${card.participant.id}"`];

		const assignments = timeSlots.map((time) => {
			const assignment = card.assignments.get(time);
			if (assignment === 'FREE') return 'FREE';
			if (assignment) {
				return `"${assignment.room} - ${assignment.topic.replace(/"/g, '""')}"`;
			}
			return 'ERROR';
		});

		return [...participantInfo, ...assignments].join(',');
	});

	return [csvHeader.join(','), ...csvRows].join('\n');
};
