import { ElementId } from './constants';

// Main app structure
export const createAppStructure = (): string => `
    <div id="${ElementId.APP}">
        <div class="upload-section">
            <input type="file" id="${ElementId.PARTICIPANTS_UPLOAD}" accept=".csv">
            <div id="${ElementId.PARTICIPANTS_ERROR}" class="error-message"></div>
            <div id="${ElementId.PARTICIPANT_LIST}" class="data-list"></div>
        </div>
        
        <div class="upload-section">
            <input type="file" id="${ElementId.EVENTS_UPLOAD}" accept=".csv">
            <div id="${ElementId.EVENTS_ERROR}" class="error-message"></div>
            <div id="${ElementId.EVENTS_LIST}" class="data-list"></div>
        </div>

        <div class="upload-section">
            <input type="file" id="${ElementId.ROOM_CAPACITIES_UPLOAD}" accept=".csv">
            <div id="${ElementId.ROOM_CAPACITIES_ERROR}" class="error-message"></div>
            <div id="${ElementId.ROOM_CAPACITY_LIST}" class="data-list"></div>
        </div>

        <button id="${ElementId.DANCE_CARD_BUTTON}">Generate Dance Cards</button>
        <div id="${ElementId.DANCE_CARD_CONTAINER}" class="dance-card-container"></div>
    </div>`;

// Help content template
export const createHelpContent = (): string => `
    <div class="app-description" id="app-description">
        <button id="close-description" class="close-button">&times;</button>
        <p>This application helps organizers assign participants to different rooms and topics for events with multiple concurrent sessions.</p>
        <div class="instructions">
            <h2>How to use:</h2>
            <ol>
                <li>Upload a <strong>Participants CSV</strong> file with ID and Name columns</li>
                <li>Upload an <strong>Events CSV</strong> file with Time, Topic, and Room columns (accepts both 12-hour or 24-hour time formats)</li>
                <li>Upload a <strong>Room Capacity CSV</strong> file with Room and Capacity columns</li>
                <li>Click the <strong>Dance Cards</strong> button to generate assignments</li>
                <li>Download the results using the <strong>Export CSV</strong> button</li>
            </ol>
            <p>The system will ensure participants don't see the same topic twice and will respect room capacity limits.</p>
        </div>
    </div>`;

// Events table template
export const createEventsTableHeader = (): string => `
    <thead>
        <tr>
            <th>Topic</th>
            <th>Room</th>
            <th>Available Times</th>
        </tr>
    </thead>`;

export const createTimeScheduleHeader = (): string => `
    <thead>
        <tr>
            <th>Time</th>
            <th>Topic</th>
            <th>Room</th>
        </tr>
    </thead>`;

// Dance card results header
export const createDanceCardResultsHeader = (count: number): string => `
    <div class="results-header">
        <h2>Generated Dance Cards</h2>
        <p class="results-summary">${count} participants assigned</p>
    </div>`;

// Missed topics table header
export const createMissedTopicsHeader = (): string => `
    <div class="missed-topics-section">
        <h3>Participants Missing Topics</h3>
        <table class="missed-topics-table">
            <thead>
                <tr>
                    <th>Participant</th>
                    <th>Missed Topics</th>
                </tr>
            </thead>
        </table>
    </div>`;

// Participant table header
export const createParticipantTableHeader = (): string => `
    <thead>
        <tr>
            <th>ID</th>
            <th>Name</th>
        </tr>
    </thead>`;

// Room capacity table header
export const createRoomCapacityTableHeader = (): string => `
    <thead>
        <tr>
            <th>Room</th>
            <th>Capacity</th>
        </tr>
    </thead>`;
