// Define the proper event type for file inputs
// @ts-ignore in some places to support browser API compatibility
export interface FileInputEvent extends Event {
	target: HTMLInputElement;
}

// Define types for our data
export type Participant = {
	id: string;
	name: string;
};

export type EventData = {
	time: string;
	topic: string;
	room: string;
};

export type RoomCapacity = {
	room: string;
	capacity: number;
};

// Type for dance card assignment
export type DanceCardAssignment =
	| {
			time: string;
			room: string;
			topic: string;
	  }
	| 'FREE';

// Type for participant dance card
export type ParticipantDanceCard = {
	participant: Participant;
	assignments: Map<string, DanceCardAssignment>; // time -> assignment
	missedTopics: Set<string>; // topics that could not be visited
};

// Data structure for managing dance cards
export type DanceCardData = {
	// Maps from room → time → participant[]
	roomsTimesParticipants: Map<string, Map<string, Participant[]>>;

	// Maps from participant ID → time → room[]
	participantsTimesRooms: Map<string, Map<string, string[]>>;
};
