import { describe, expect, it } from 'vitest';
import {
	convertToFinalFormat,
	performAnnealingPhase,
	performFirstAssignmentPhase,
	preprocessData,
	setupAssignmentState,
} from '../dancecard';
import { EventData, Participant, RoomCapacity } from '../types';

describe('Dance Card Generation Phases', () => {
	// Test data setup
	const participants: Participant[] = [
		{ id: 'P1', name: 'Person 1' },
		{ id: 'P2', name: 'Person 2' },
		{ id: 'P3', name: 'Person 3' },
		{ id: 'P4', name: 'Person 4' },
		{ id: 'P5', name: 'Person 5' },
	];

	const roomCapacities: RoomCapacity[] = [
		{ room: 'Room A', capacity: 2 },
		{ room: 'Room B', capacity: 2 },
	];

	const events: EventData[] = [
		{ time: '09:00', room: 'Room A', topic: 'Topic 1' },
		{ time: '09:00', room: 'Room B', topic: 'Topic 2' },
		{ time: '10:00', room: 'Room A', topic: 'Topic 2' },
		{ time: '10:00', room: 'Room B', topic: 'Topic 1' },
	];

	const initialState = { participants, events, roomCapacities };

	it('preprocessData should correctly extract time slots, topics, and create time-room-topic map', () => {
		const preprocessed = preprocessData(initialState);

		expect(preprocessed.timeSlots).toEqual(['09:00', '10:00']);
		expect(preprocessed.allTopics).toEqual(['Topic 1', 'Topic 2']);

		// Verify time-room-topic mapping
		expect(preprocessed.timeRoomTopicMap.get('09:00')?.get('Room A')).toBe('Topic 1');
		expect(preprocessed.timeRoomTopicMap.get('09:00')?.get('Room B')).toBe('Topic 2');
		expect(preprocessed.timeRoomTopicMap.get('10:00')?.get('Room A')).toBe('Topic 2');
		expect(preprocessed.timeRoomTopicMap.get('10:00')?.get('Room B')).toBe('Topic 1');
	});

	it('setupAssignmentState should initialize participant and room states correctly', () => {
		const preprocessed = preprocessData(initialState);
		const setupState = setupAssignmentState(initialState, preprocessed);

		// Check participant states
		expect(setupState.participantStates).toHaveLength(5);
		setupState.participantStates.forEach((pState) => {
			expect(pState.unvisitedTopics.size).toBe(2);
			expect(pState.assignments.size).toBe(0);
		});

		// Check room states
		expect(setupState.roomStates).toHaveLength(2);
		setupState.roomStates.forEach((rState) => {
			expect(rState.capacity).toBe(2);
			expect(rState.attendees.size).toBe(2); // Two time slots
			expect(rState.attendees.get('09:00')?.size).toBe(0);
			expect(rState.attendees.get('10:00')?.size).toBe(0);
		});
	});

	it('performFirstAssignmentPhase should assign participants to rooms respecting capacity', () => {
		const preprocessed = preprocessData(initialState);
		const setupState = setupAssignmentState(initialState, preprocessed);
		const firstPhaseState = performFirstAssignmentPhase(setupState);

		// Check that assignments respect room capacity
		['09:00', '10:00'].forEach((time) => {
			const roomACount =
				firstPhaseState.roomStates.find((r) => r.room === 'Room A')?.attendees.get(time)
					?.size ?? 0;
			const roomBCount =
				firstPhaseState.roomStates.find((r) => r.room === 'Room B')?.attendees.get(time)
					?.size ?? 0;

			expect(roomACount).toBeLessThanOrEqual(2);
			expect(roomBCount).toBeLessThanOrEqual(2);
		});

		// Check that participants have assignments
		firstPhaseState.participantStates.forEach((pState) => {
			expect(pState.assignments.size).toBeGreaterThan(0);
		});
	});

	it('performAnnealingPhase should attempt to optimize assignments', () => {
		const preprocessed = preprocessData(initialState);
		const setupState = setupAssignmentState(initialState, preprocessed);
		const firstPhaseState = performFirstAssignmentPhase(setupState);
		const annealedState = performAnnealingPhase(firstPhaseState);

		// Verify that room capacities are still respected
		annealedState.roomStates.forEach((rState) => {
			rState.attendees.forEach((attendees) => {
				expect(attendees.size).toBeLessThanOrEqual(rState.capacity);
			});
		});

		// Verify that all participants still have assignments
		annealedState.participantStates.forEach((pState) => {
			expect(pState.assignments.size).toBeGreaterThan(0);
		});
	});

	it('convertToFinalFormat should create valid dance cards', () => {
		const preprocessed = preprocessData(initialState);
		const setupState = setupAssignmentState(initialState, preprocessed);
		const firstPhaseState = performFirstAssignmentPhase(setupState);
		const annealedState = performAnnealingPhase(firstPhaseState);
		const finalState = convertToFinalFormat(annealedState);

		expect(finalState.danceCards).toHaveLength(5);

		finalState.danceCards.forEach((card) => {
			// Each card should have assignments for both time slots
			expect(card.assignments.size).toBe(2);

			// Each assignment should either be 'FREE' or have a valid room and topic
			card.assignments.forEach((assignment, time) => {
				expect(preprocessed.timeSlots).toContain(time);
				if (assignment !== 'FREE') {
					expect(assignment.room).toBeDefined();
					expect(assignment.topic).toBeDefined();
					expect(['Room A', 'Room B']).toContain(assignment.room);
					expect(['Topic 1', 'Topic 2']).toContain(assignment.topic);
				}
			});
		});
	});
});
