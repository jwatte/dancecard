// Help text functionality
export const helpContent = `
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
  </div>
`;

// Help container element
let helpContainer: HTMLElement | null = null;

// Track if help is currently visible
let isHelpVisible = false;

// Function to create help icon
export const createHelpIcon = (parentElement: HTMLElement): void => {
	const helpIcon = document.createElement('button');
	helpIcon.className = 'help-icon';
	helpIcon.id = 'help-icon';
	helpIcon.innerHTML = '?';
	helpIcon.title = 'Show Help';
	helpIcon.addEventListener('click', toggleHelp);
	
	parentElement.appendChild(helpIcon);
};

// Function to toggle help visibility
export const toggleHelp = (): void => {
	if (isHelpVisible) {
		hideHelp();
	} else {
		showHelp();
	}
};

// Function to initialize help
export const initializeHelp = (): void => {
	// Create help container
	helpContainer = document.createElement('div');
	helpContainer.className = 'help-container';
	helpContainer.innerHTML = helpContent;
	helpContainer.style.display = 'none';
	helpContainer.style.overflow = 'hidden';
	helpContainer.style.maxHeight = '0';
	helpContainer.style.transition = 'max-height 0.5s ease-in-out';
	
	// Add to document body
	document.body.insertBefore(helpContainer, document.body.firstChild);
	
	// Set up close button
	const closeButton = document.getElementById('close-description');
	if (closeButton) {
		closeButton.addEventListener('click', () => {
			hideHelp();
			// Save preference in localStorage
			localStorage.setItem('helpClosed', 'true');
		});
	}
	
	// Show help if it hasn't been closed before
	if (!localStorage.getItem('helpClosed')) {
		// Use timeout to ensure the animation works (allows DOM to settle first)
		setTimeout(() => {
			showHelp();
		}, 500);
	}
};

// Function to show help with animation
const showHelp = (): void => {
	if (!helpContainer) return;
	
	// Make visible but with 0 height
	helpContainer.style.display = 'block';
	
	// Trigger reflow to ensure the transition works
	void helpContainer.offsetHeight;
	
	// Measure content height
	const contentHeight = helpContainer.scrollHeight;
	
	// Set max height to animate to full size
	helpContainer.style.maxHeight = `${contentHeight}px`;
	
	// Hide the help icon when help is visible
	const helpIcon = document.getElementById('help-icon');
	if (helpIcon) {
		helpIcon.style.display = 'none';
	}
	
	isHelpVisible = true;
};

// Function to hide help with animation
const hideHelp = (): void => {
	if (!helpContainer) return;
	
	// Set max height to 0 to animate closing
	helpContainer.style.maxHeight = '0';
	
	// Hide completely after animation completes
	setTimeout(() => {
		if (helpContainer) {
			helpContainer.style.display = 'none';
		}
		
		// Show the help icon when help is hidden
		const helpIcon = document.getElementById('help-icon');
		if (helpIcon) {
			helpIcon.style.display = 'block';
		}
	}, 500); // Match the transition duration
	
	isHelpVisible = false;
};