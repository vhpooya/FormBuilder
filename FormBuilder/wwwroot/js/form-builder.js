document.addEventListener('DOMContentLoaded', function () {
    // Global variables
    let selectedElement = null;
    let formData = {
        title: '',
        description: '',
        containers: [],
        customCss: '',
        customJs: ''
    };

    // Initialize drag and drop
    initDragAndDrop();

    // Initialize event listeners
    document.getElementById('saveForm').addEventListener('click', saveForm);
    document.getElementById('previewForm').addEventListener('click', previewForm);

    // Initialize form properties if editing existing form
    if (window.location.pathname.includes('/Edit/')) {
        loadExistingForm();
    }

    function initDragAndDrop() {
        const controlItems = document.querySelectorAll('.control-item');
        const formCanvas = document.getElementById('formCanvas');

        // Make control items draggable
        controlItems.forEach(item => {
            item.addEventListener('dragstart', function (e) {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    type: this.dataset.type,
                    containerType: this.dataset.containerType
                }));
            });
        });

        // Set up drop zone
        formCanvas.addEventListener('dragover', function (e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });

        formCanvas.addEventListener('dragleave', function () {
            this.classList.remove('drag-over');
        });

        formCanvas.addEventListener('drop', function (e) {
            e.preventDefault();
            this.classList.remove('drag-over');

            const data = JSON.parse(e.dataTransfer.getData('text/plain'));

            if (data.type === 'container') {
                addContainer(data.containerType, e.clientX, e.clientY);
            } else {
                // If dropped on a container, add to that container
                const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
                const container = findParentContainer(dropTarget);

                if (container) {
                    addFieldToContainer(data.type, container);
                } else {
                    // Create a new container for the field
                    const newContainer = addContainer('div', e.clientX, e.clientY);
                    addFieldToContainer(data.type, newContainer);
                }
            }
        });
    }

    function addContainer(containerType, x, y) {
        const containerId = generateId();
        const container = document.createElement('div');
        container.className = 'form-container ui-droppable';
        container.dataset.containerId = containerId;
        container.innerHTML = `
            <div class="container-header">
                <span>${containerType} Container</span>
                <div class="container-actions">
                    <button class="btn btn-sm btn-outline-secondary edit-container"><i class="bi bi-gear"></i></button>
                    <button class="btn btn-sm btn-outline-danger delete-container"><i class="bi bi-trash"></i></button>
                </div>
            </div>
            <div class="container-body"></div>
        `;

        // Position the container near the drop point
        container.style.position = 'absolute';
        container.style.left = `${x - 200}px`; // Adjust as needed
        container.style.top = `${y - 50}px`;

        // Add to DOM
        document.getElementById('formCanvas').appendChild(container);

        // Add to form data
        const containerData = {
            id: containerId,
            type: containerType,
            fields: [],
            style: {
                layoutType: 'flex',
                flex: {
                    direction: 'row',
                    justifyContent: 'flex-start',
                    alignItems: 'stretch',
                    gap: '0',
                    wrap: false
                },
                grid: {
                    columns: 1,
                    rows: 1,
                    gap: '0'
                }
            }
        };
        formData.containers.push(containerData);

        // Add event listeners
        container.querySelector('.edit-container').addEventListener('click', () => showContainerProperties(containerId));
        container.querySelector('.delete-container').addEventListener('click', () => deleteContainer(containerId));

        // Make container a drop target
        const containerBody = container.querySelector('.container-body');
        makeDroppable(containerBody, containerId);

        return container;
    }

    function addFieldToContainer(fieldType, containerElement) {
        const containerId = containerElement.dataset.containerId;
        const fieldId = generateId();

        // Create field element
        const fieldElement = createFieldElement(fieldType, fieldId);
        containerElement.querySelector('.container-body').appendChild(fieldElement);

        // Add to form data
        const container = formData.containers.find(c => c.id === containerId);
        if (container) {
            const fieldData = {
                id: fieldId,
                fieldType: fieldType,
                label: `${fieldType} Field`,
                name: `field_${fieldId.substring(0, 4)}`,
                placeholder: '',
                tooltip: '',
                isRequired: false,
                validation: {},
                style: {}
            };
            container.fields.push(fieldData);
        }

        // Add event listeners
        fieldElement.addEventListener('click', () => showFieldProperties(fieldId));
    }

    function createFieldElement(fieldType, fieldId) {
        const fieldElement = document.createElement('div');
        fieldElement.className = 'form-field ui-draggable';
        fieldElement.dataset.fieldId = fieldId;

        let fieldHtml = '';
        switch (fieldType) {
            case 'text':
                fieldHtml = `
                    <label>Text Input</label>
                    <input type="text" class="form-control" />
                `;
                break;
            case 'email':
                fieldHtml = `
                    <label>Email Input</label>
                    <input type="email" class="form-control" />
                `;
                break;
            case 'number':
                fieldHtml = `
                    <label>Number Input</label>
                    <input type="number" class="form-control" />
                `;
                break;
            case 'textarea':
                fieldHtml = `
                    <label>Textarea</label>
                    <textarea class="form-control"></textarea>
                `;
                break;
            case 'select':
                fieldHtml = `
                    <label>Dropdown</label>
                    <select class="form-control">
                        <option>Option 1</option>
                        <option>Option 2</option>
                    </select>
                `;
                break;
            case 'checkbox':
                fieldHtml = `
                    <label>Checkbox</label>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" />
                        <label class="form-check-label">Option 1</label>
                    </div>
                `;
                break;
            case 'radio':
                fieldHtml = `
                    <label>Radio Buttons</label>
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="radio_${fieldId.substring(0, 4)}" />
                        <label class="form-check-label">Option 1</label>
                    </div>
                `;
                break;
        }

        fieldElement.innerHTML = fieldHtml;
        return fieldElement;
    }

    function showFieldProperties(fieldId) {
        // Find the field in form data
        let fieldData = null;
        let containerId = null;

        for (const container of formData.containers) {
            const field = container.fields.find(f => f.id === fieldId);
            if (field) {
                fieldData = field;
                containerId = container.id;
                break;
            }
        }

        if (!fieldData) return;

        // Update properties panel
        const propertiesPanel = document.getElementById('formPropertiesPanel');
        propertiesPanel.innerHTML = `
            <h6>Field Properties</h6>
            <div class="mb-3">
                <label class="form-label">Label</label>
                <input type="text" class="form-control" id="fieldLabel" value="${fieldData.label || ''}" />
            </div>
            <div class="mb-3">
                <label class="form-label">Name</label>
                <input type="text" class="form-control" id="fieldName" value="${fieldData.name || ''}" />
            </div>
            <div class="mb-3">
                <label class="form-label">Placeholder</label>
                <input type="text" class="form-control" id="fieldPlaceholder" value="${fieldData.placeholder || ''}" />
            </div>
            <div class="mb-3">
                <label class="form-label">Tooltip</label>
                <input type="text" class="form-control" id="fieldTooltip" value="${fieldData.tooltip || ''}" />
            </div>
            <div class="mb-3 form-check">
                <input type="checkbox" class="form-check-input" id="fieldRequired" ${fieldData.isRequired ? 'checked' : ''} />
                <label class="form-check-label">Required</label>
            </div>
            
            <h6 class="mt-4">Validation</h6>
            <div class="mb-3">
                <label class="form-label">Minimum Length</label>
                <input type="number" class="form-control" id="fieldMinLength" value="${fieldData.validation.minLength || ''}" />
            </div>
            <div class="mb-3">
                <label class="form-label">Maximum Length</label>
                <input type="number" class="form-control" id="fieldMaxLength" value="${fieldData.validation.maxLength || ''}" />
            </div>
            <div class="mb-3">
                <label class="form-label">Pattern (Regex)</label>
                <input type="text" class="form-control" id="fieldPattern" value="${fieldData.validation.pattern || ''}" />
            </div>
            
            <button class="btn btn-primary mt-3" id="saveFieldProperties">Save Properties</button>
            <button class="btn btn-danger mt-3" id="deleteField">Delete Field</button>
        `;

        // Add event listeners
        document.getElementById('saveFieldProperties').addEventListener('click', () => {
            saveFieldProperties(fieldId, containerId);
        });

        document.getElementById('deleteField').addEventListener('click', () => {
            deleteField(fieldId, containerId);
        });
    }

    function saveFieldProperties(fieldId, containerId) {
        const container = formData.containers.find(c => c.id === containerId);
        if (!container) return;

        const field = container.fields.find(f => f.id === fieldId);
        if (!field) return;

        // Update field data
        field.label = document.getElementById('fieldLabel').value;
        field.name = document.getElementById('fieldName').value;
        field.placeholder = document.getElementById('fieldPlaceholder').value;
        field.tooltip = document.getElementById('fieldTooltip').value;
        field.isRequired = document.getElementById('fieldRequired').checked;

        // Update validation
        field.validation = {
            minLength: document.getElementById('fieldMinLength').value || null,
            maxLength: document.getElementById('fieldMaxLength').value || null,
            pattern: document.getElementById('fieldPattern').value || null
        };

        // Update the field in the UI
        updateFieldInUI(fieldId, containerId);
    }

    function updateFieldInUI(fieldId, containerId) {
        const container = formData.containers.find(c => c.id === containerId);
        if (!container) return;

        const field = container.fields.find(f => f.id === fieldId);
        if (!field) return;

        const fieldElement = document.querySelector(`[data-field-id="${fieldId}"]`);
        if (!fieldElement) return;

        // Update the field label
        const labelElement = fieldElement.querySelector('label');
        if (labelElement) {
            labelElement.textContent = field.label || '';
        }

        // Update the input placeholder
        const inputElement = fieldElement.querySelector('input, textarea, select');
        if (inputElement) {
            inputElement.placeholder = field.placeholder || '';
            inputElement.name = field.name || '';
            inputElement.required = field.isRequired;
        }
    }

    function deleteField(fieldId, containerId) {
        const container = formData.containers.find(c => c.id === containerId);
        if (!container) return;

        // Remove from form data
        container.fields = container.fields.filter(f => f.id !== fieldId);

        // Remove from UI
        const fieldElement = document.querySelector(`[data-field-id="${fieldId}"]`);
        if (fieldElement) {
            fieldElement.remove();
        }

        // Clear properties panel
        document.getElementById('formPropertiesPanel').innerHTML = `
            <div class="empty-properties-message">
                Select an element to edit its properties
            </div>
        `;
    }

    function showContainerProperties(containerId) {
        const container = formData.containers.find(c => c.id === containerId);
        if (!container) return;

        // Update properties panel
        const propertiesPanel = document.getElementById('formPropertiesPanel');
        propertiesPanel.innerHTML = `
            <h6>Container Properties</h6>
            
            <div class="mb-3">
                <label class="form-label">Layout Type</label>
                <select class="form-select" id="containerLayoutType">
                    <option value="flex" ${container.style.layoutType === 'flex' ? 'selected' : ''}>Flex</option>
                    <option value="grid" ${container.style.layoutType === 'grid' ? 'selected' : ''}>Grid</option>
                </select>
            </div>
            
            <div id="flexProperties" style="${container.style.layoutType !== 'flex' ? 'display: none;' : ''}">
                <h6>Flex Properties</h6>
                <div class="mb-3">
                    <label class="form-label">Direction</label>
                    <select class="form-select" id="flexDirection">
                        <option value="row" ${container.style.flex.direction === 'row' ? 'selected' : ''}>Row</option>
                        <option value="column" ${container.style.flex.direction === 'column' ? 'selected' : ''}>Column</option>
                        <option value="row-reverse" ${container.style.flex.direction === 'row-reverse' ? 'selected' : ''}>Row Reverse</option>
                        <option value="column-reverse" ${container.style.flex.direction === 'column-reverse' ? 'selected' : ''}>Column Reverse</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">Justify Content</label>
                    <select class="form-select" id="flexJustifyContent">
                        <option value="flex-start" ${container.style.flex.justifyContent === 'flex-start' ? 'selected' : ''}>Flex Start</option>
                        <option value="flex-end" ${container.style.flex.justifyContent === 'flex-end' ? 'selected' : ''}>Flex End</option>
                        <option value="center" ${container.style.flex.justifyContent === 'center' ? 'selected' : ''}>Center</option>
                        <option value="space-between" ${container.style.flex.justifyContent === 'space-between' ? 'selected' : ''}>Space Between</option>
                        <option value="space-around" ${container.style.flex.justifyContent === 'space-around' ? 'selected' : ''}>Space Around</option>
                        <option value="space-evenly" ${container.style.flex.justifyContent === 'space-evenly' ? 'selected' : ''}>Space Evenly</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">Align Items</label>
                    <select class="form-select" id="flexAlignItems">
                        <option value="flex-start" ${container.style.flex.alignItems === 'flex-start' ? 'selected' : ''}>Flex Start</option>
                        <option value="flex-end" ${container.style.flex.alignItems === 'flex-end' ? 'selected' : ''}>Flex End</option>
                        <option value="center" ${container.style.flex.alignItems === 'center' ? 'selected' : ''}>Center</option>
                        <option value="baseline" ${container.style.flex.alignItems === 'baseline' ? 'selected' : ''}>Baseline</option>
                        <option value="stretch" ${container.style.flex.alignItems === 'stretch' ? 'selected' : ''}>Stretch</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">Gap</label>
                    <input type="text" class="form-control" id="flexGap" value="${container.style.flex.gap || '0'}" />
                </div>
                <div class="mb-3 form-check">
                    <input type="checkbox" class="form-check-input" id="flexWrap" ${container.style.flex.wrap ? 'checked' : ''} />
                    <label class="form-check-label">Wrap Items</label>
                </div>
            </div>
            
            <div id="gridProperties" style="${container.style.layoutType !== 'grid' ? 'display: none;' : ''}">
                <h6>Grid Properties</h6>
                <div class="mb-3">
                    <label class="form-label">Columns</label>
                    <input type="number" class="form-control" id="gridColumns" value="${container.style.grid.columns || 1}" />
                </div>
                <div class="mb-3">
                    <label class="form-label">Rows</label>
                    <input type="number" class="form-control" id="gridRows" value="${container.style.grid.rows || 1}" />
                </div>
                <div class="mb-3">
                    <label class="form-label">Gap</label>
                    <input type="text" class="form-control" id="gridGap" value="${container.style.grid.gap || '0'}" />
                </div>
            </div>
            
            <h6 class="mt-4">Appearance</h6>
            <div class="mb-3">
                <label class="form-label">Background Color</label>
                <input type="color" class="form-control form-control-color" id="containerBackgroundColor" value="${container.style.backgroundColor || '#ffffff'}" />
            </div>
            <div class="mb-3">
                <label class="form-label">Padding</label>
                <input type="text" class="form-control" id="containerPadding" value="${container.style.padding || ''}" />
            </div>
            <div class="mb-3">
                <label class="form-label">Margin</label>
                <input type="text" class="form-control" id="containerMargin" value="${container.style.margin || ''}" />
            </div>
            <div class="mb-3">
                <label class="form-label">Border</label>
                <input type="text" class="form-control" id="containerBorder" value="${container.style.border || ''}" />
            </div>
            
            <button class="btn btn-primary mt-3" id="saveContainerProperties">Save Properties</button>
            <button class="btn btn-danger mt-3" id="deleteContainer">Delete Container</button>
        `;

        // Show/hide layout properties based on selected layout type
        document.getElementById('containerLayoutType').addEventListener('change', function () {
            document.getElementById('flexProperties').style.display = this.value === 'flex' ? 'block' : 'none';
            document.getElementById('gridProperties').style.display = this.value === 'grid' ? 'block' : 'none';
        });

        // Add event listeners
        document.getElementById('saveContainerProperties').addEventListener('click', () => {
            saveContainerProperties(containerId);
        });

        document.getElementById('deleteContainer').addEventListener('click', () => {
            deleteContainer(containerId);
        });
    }

    function saveContainerProperties(containerId) {
        const container = formData.containers.find(c => c.id === containerId);
        if (!container) return;

        // Update container data
        container.style.layoutType = document.getElementById('containerLayoutType').value;

        // Update flex properties
        container.style.flex = {
            direction: document.getElementById('flexDirection').value,
            justifyContent: document.getElementById('flexJustifyContent').value,
            alignItems: document.getElementById('flexAlignItems').value,
            gap: document.getElementById('flexGap').value,
            wrap: document.getElementById('flexWrap').checked
        };

        // Update grid properties
        container.style.grid = {
            columns: parseInt(document.getElementById('gridColumns').value) || 1,
            rows: parseInt(document.getElementById('gridRows').value) || 1,
            gap: document.getElementById('gridGap').value
        };

        // Update appearance
        container.style.backgroundColor = document.getElementById('containerBackgroundColor').value;
        container.style.padding = document.getElementById('containerPadding').value;
        container.style.margin = document.getElementById('containerMargin').value;
        container.style.border = document.getElementById('containerBorder').value;

        // Update the container in the UI
        updateContainerInUI(containerId);
    }

    function updateContainerInUI(containerId) {
        const container = formData.containers.find(c => c.id === containerId);
        if (!container) return;

        const containerElement = document.querySelector(`[data-container-id="${containerId}"]`);
        if (!containerElement) return;

        // Update container styling based on layout type
        if (container.style.layoutType === 'flex') {
            containerElement.style.display = 'flex';
            containerElement.style.flexDirection = container.style.flex.direction;
            containerElement.style.justifyContent = container.style.flex.justifyContent;
            containerElement.style.alignItems = container.style.flex.alignItems;
            containerElement.style.gap = container.style.flex.gap;
            containerElement.style.flexWrap = container.style.flex.wrap ? 'wrap' : 'nowrap';
        } else if (container.style.layoutType === 'grid') {
            containerElement.style.display = 'grid';
            containerElement.style.gridTemplateColumns = `repeat(${container.style.grid.columns}, 1fr)`;
            containerElement.style.gridTemplateRows = `repeat(${container.style.grid.rows}, auto)`;
            containerElement.style.gap = container.style.grid.gap;
        }

        // Update appearance
        containerElement.style.backgroundColor = container.style.backgroundColor;
        containerElement.style.padding = container.style.padding;
        containerElement.style.margin = container.style.margin;
        containerElement.style.border = container.style.border;
    }

    function deleteContainer(containerId) {
        // Remove from form data
        formData.containers = formData.containers.filter(c => c.id !== containerId);

        // Remove from UI
        const containerElement = document.querySelector(`[data-container-id="${containerId}"]`);
        if (containerElement) {
            containerElement.remove();
        }

        // Clear properties panel
        document.getElementById('formPropertiesPanel').innerHTML = `
            <div class="empty-properties-message">
                Select an element to edit its properties
            </div>
        `;
    }

    function saveForm() {
        // Add form metadata
        formData.title = prompt('Enter form title:', formData.title || 'My Form') || 'My Form';
        formData.description = prompt('Enter form description:', formData.description || '') || '';

        // Send form data to server
        fetch('/FormBuilder/Save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.id) {
                    alert('Form saved successfully!');
                    window.location.href = '/FormBuilder';
                } else {
                    alert('Error saving form');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error saving form');
            });
    }

    function previewForm() {
        // Open form preview in a new window
        const previewWindow = window.open('', '_blank');

        fetch('/FormBuilder/GetFormHtml', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
            .then(response => response.text())
            .then(html => {
                previewWindow.document.write(html);
                previewWindow.document.close();
            })
            .catch(error => {
                console.error('Error:', error);
                previewWindow.close();
                alert('Error generating preview');
            });
    }

    function loadExistingForm() {
        // Fetch existing form data from server
        fetch(window.location.pathname + '/GetFormJson')
            .then(response => response.json())
            .then(data => {
                formData = data;
                renderExistingForm();
            })
            .catch(error => {
                console.error('Error loading form:', error);
            });
    }

    function renderExistingForm() {
        const formCanvas = document.getElementById('formCanvas');
        formCanvas.innerHTML = '';

        // Render containers and fields
        formData.containers.forEach(container => {
            const containerElement = document.createElement('div');
            containerElement.className = 'form-container ui-droppable';
            containerElement.dataset.containerId = container.id;
            containerElement.innerHTML = `
                <div class="container-header">
                    <span>${container.type} Container</span>
                    <div class="container-actions">
                        <button class="btn btn-sm btn-outline-secondary edit-container"><i class="bi bi-gear"></i></button>
                        <button class="btn btn-sm btn-outline-danger delete-container"><i class="bi bi-trash"></i></button>
                    </div>
                </div>
                <div class="container-body"></div>
            `;

            // Add container to canvas
            formCanvas.appendChild(containerElement);

            // Add fields to container
            const containerBody = containerElement.querySelector('.container-body');
            container.fields.forEach(field => {
                const fieldElement = createFieldElement(field.fieldType, field.id);
                containerBody.appendChild(fieldElement);
            });

            // Apply container styling
            updateContainerInUI(container.id);

            // Add event listeners
            containerElement.querySelector('.edit-container').addEventListener('click', () => showContainerProperties(container.id));
            containerElement.querySelector('.delete-container').addEventListener('click', () => deleteContainer(container.id));

            // Make container a drop target
            makeDroppable(containerBody, container.id);
        });
    }

    function makeDroppable(element, containerId) {
        element.addEventListener('dragover', function (e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });

        element.addEventListener('dragleave', function () {
            this.classList.remove('drag-over');
        });

        element.addEventListener('drop', function (e) {
            e.preventDefault();
            this.classList.remove('drag-over');

            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (data.type !== 'container') {
                addFieldToContainer(data.type, document.querySelector(`[data-container-id="${containerId}"]`));
            }
        });
    }

    function findParentContainer(element) {
        while (element && !element.classList.contains('form-container')) {
            element = element.parentElement;
        }
        return element;
    }

    function generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
});