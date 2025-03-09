// DOM Element IDs
export enum ElementId {
	APP = 'app',
	PARTICIPANTS_UPLOAD = 'participants-upload',
	EVENTS_UPLOAD = 'events-upload',
	ROOM_CAPACITIES_UPLOAD = 'room-capacities-upload',
	PARTICIPANTS_ERROR = 'participants-error',
	EVENTS_ERROR = 'events-error',
	ROOM_CAPACITIES_ERROR = 'room-capacities-error',
	PARTICIPANT_LIST = 'participant-list',
	EVENTS_LIST = 'events-list',
	ROOM_CAPACITY_LIST = 'room-capacity-list',
	DANCE_CARD_BUTTON = 'dance-card-button',
	DANCE_CARD_CONTAINER = 'dance-card-container',
}

// Error Messages
export const ErrorMessages = {
	CSV_ROW_LIMIT: 'Error: CSV file exceeds the maximum limit of 999 data rows.',
	MISSING_ELEMENTS: 'Missing required DOM elements:',
	MISSING_DATA: {
		PARTICIPANTS: 'participants',
		EVENTS: 'events',
		ROOM_CAPACITIES: 'room capacities',
	},
} as const;

// Button States
export const ButtonStates = {
	ENABLED: 'Press to generate dance cards',
	DISABLED_FORMAT: (missing: string[]) => {
		if (missing.length === 0) return ButtonStates.ENABLED;
		if (missing.length === 1) return `Upload ${missing[0]} to enable`;
		if (missing.length === 2) return `Upload ${missing[0]} and ${missing[1]} to enable`;
		return 'Upload all CSV files to enable';
	},
} as const;
