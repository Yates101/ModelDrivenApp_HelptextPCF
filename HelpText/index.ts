// import { HelpText, IHelpTextProps } from "./HelpText";
import { IInputs, IOutputs } from "./generated/ManifestTypes";

interface EventListener {
    (evt: Event): void;
}

interface MessageToPCF {
    Field: string
}

export class HelpText implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _notifyOutputChanged: () => void;
    private _container: HTMLDivElement;
    private _context: ComponentFramework.Context<IInputs>;
	// Flag if control view has been rendered
	private _controlViewRendered: boolean;
    // Name of entity to use for Web API calls
    private _publisherPrefix: string;
    // Logical name of selected field, used to look up related helptext
    private _fieldLogicalName: string;
    // Title to be displayed above helptext
    private _helpTextHeader: HTMLElement;
    // Help text to be displayed
    private _helpText: HTMLElement;

    constructor() { }

    /**
	 * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
	 * Data-set values are not initialized here, use updateView.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
	 * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
	 * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
	 * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
	 */
    public init( context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement): void {
        // Control initialization code
        this._context = context;
        this._container = document.createElement("div");
        this._notifyOutputChanged = notifyOutputChanged;
        // Grab publisher from control parameters
        this._publisherPrefix = context.parameters.PublisherPrefix.raw != null ? context.parameters.PublisherPrefix.raw : "";

        // Add event listener to the window to pick up the return message of the event listeners added to fields and pass to the event handler function
        window.addEventListener('onSelectField', ((event: CustomEvent) => {
            const message: MessageToPCF = event.detail;

            console.log(message, 'message recieved by PCF')

            this.formFieldSelected(message.Field);
        }) as EventListener)

        // Add event listeners to the form fields to register the selection
        // Only generated form field container divs have this tag
        const formFields = document.querySelectorAll(`div[data-control-name]:not([data-control-name*="helptext"]`);
        // Unfortunately out PCF is in a generated field, so we have to make sue it doesn't grab that

        // Create custome event that will be registered by PCF's event listener
        formFields.forEach(
            (div) => {
                div.addEventListener("click", () => {
                    const event = new CustomEvent("onSelectField", {
                        detail: {
                            Field: div.getAttribute("data-control-name")
                        }
                    });
                    window.dispatchEvent(event);
                });
            }
        );
        
        // Assign placeholder text
        let placeHolderHeader = "";
        let placeHolderText = "";

		if (context.parameters.PlaceHolderHeader.raw != null) {
			placeHolderHeader  = placeHolderHeader + context.parameters.PlaceHolderHeader.raw;
        } else {
            placeHolderHeader  = placeHolderHeader + "Help Text";
        }
        if (context.parameters.PlaceHolderText.raw != null) {
			placeHolderText  = placeHolderText + context.parameters.PlaceHolderText.raw;
        } else {
			placeHolderText  = placeHolderText + "Please select a field to display the related help text below.";
        }
            // Create HTML elements (with classes for css styling)
        this._helpTextHeader = document.createElement("h1");
        this._helpText = document.createElement("p");

        // Combine text and elements and append to the container
        this._helpTextHeader.innerText = placeHolderHeader;
        this._helpText.innerText = placeHolderText;
        container.appendChild(this._helpTextHeader);
        container.appendChild(this._helpText);
    }

    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void {
        this._context = context;
		if (!this._controlViewRendered) {
			this._controlViewRendered = true;
        }

    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
     */
    public getOutputs(): IOutputs {
        return {};
    }

    /**
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        // Add code to cleanup control if necessary
    }    
    
    public formFieldSelected(fieldName: string): void {
        // If the field has already been processed, prevent unnecessary call
        if (fieldName == this._fieldLogicalName) return;
        // Assign current field to prevent unnecessary re-rendering
        this._fieldLogicalName = fieldName;

        //apply publisher prefix to helptext to get table name
        const entity = `${this._publisherPrefix}_helptext`;
        // Generate OData query string to retrieve the relatedfield attribute and filter to match the field selected
        const queryString = `?$filter=${this._publisherPrefix}_relatedfield eq '${fieldName}'`;
        
        //
        this._context.webAPI.retrieveMultipleRecords(entity, queryString).then(
            (response: ComponentFramework.WebApi.RetrieveMultipleResponse) => {
                if (response.entities.length < 1 ) {
                    this.updateContainerText(this._helpTextHeader, "Help Text Not Available");
                    this.updateContainerText(this._helpText, "No help text has been provided for this field");    
                } else {
                    const firstRespObject = response.entities[0];
                    const headerAttributeName = this._publisherPrefix + "_name";
                    const textAttributeName = this._publisherPrefix + "_text";
                    
                    this.updateContainerText(this._helpTextHeader, firstRespObject[headerAttributeName]);
                    this.updateContainerText(this._helpText, firstRespObject[textAttributeName]);    
                }
                },
                (errorResponse) => {
                    this.UpdateTextContainerWithErrorResponse(errorResponse)
                });
    }

    private updateContainerText(containerToUpdate: HTMLElement, textToInject: string): void {
		if (containerToUpdate) {
			containerToUpdate.innerText = textToInject;
		}
	}

   private UpdateTextContainerWithErrorResponse(errorResponse: any): void {
       if (this._helpText) {
           // Retrieve the error message from the errorResponse and inject into the result div
           let errorHTML = "Error with Web API call:";
           errorHTML += "<br />";
           errorHTML += errorResponse.message;
           this._helpText.innerHTML = errorHTML;
       }
   }


}
