/**
 * External dependencies
 */
import { recordEvent } from '@woocommerce/tracks';

/**
 * Internal dependencies
 */
import { waitUntilElementIsPresent } from './utils';

/**
 * Get the product data.
 *
 * @return object
 */
const getProductData = () => {
	return {
		product_id: ( document.querySelector( '#post_ID' ) as HTMLInputElement )
			?.value,
		product_type: ( document.querySelector(
			'#product-type'
		) as HTMLInputElement )?.value,
		is_downloadable: ( document.querySelector(
			'#_downloadable'
		) as HTMLInputElement )?.value,
		is_virtual: ( document.querySelector(
			'#_virtual'
		) as HTMLInputElement )?.value,
		manage_stock: ( document.querySelector(
			'#_manage_stock'
		) as HTMLInputElement )?.value,
	};
};

/**
 * Get the publish date as a string.
 *
 * @param  prefix Prefix for date element selectors.
 * @return string
 */
const getPublishDate = ( prefix = '' ) => {
	const month = ( document.querySelector(
		`#${ prefix }mm`
	) as HTMLInputElement )?.value;
	const day = ( document.querySelector(
		`#${ prefix }jj`
	) as HTMLInputElement )?.value;
	const year = ( document.querySelector(
		`#${ prefix }aa`
	) as HTMLInputElement )?.value;
	const hours = ( document.querySelector(
		`#${ prefix }hh`
	) as HTMLInputElement )?.value;
	const seconds = ( document.querySelector(
		`#${ prefix }mn`
	) as HTMLInputElement )?.value;

	return `${ month }-${ day }-${ year } ${ hours }:${ seconds }`;
};

/**
 * Get the data from the publishing widget.
 *
 * @return object
 */
const getPublishingWidgetData = () => {
	return {
		status: ( document.querySelector( '#post_status' ) as HTMLInputElement )
			?.value,
		visibility: ( document.querySelector(
			'input[name="visibility"]:checked'
		) as HTMLInputElement )?.value,
		date: getPublishDate() !== getPublishDate( 'hidden_' ) ? 'yes' : 'no',
		catalog_visibility: ( document.querySelector(
			'input[name="_visibility"]:checked'
		) as HTMLInputElement )?.value,
		featured: ( document.querySelector( '#_featured' ) as HTMLInputElement )
			?.checked,
	};
};

/**
 * Prefix all object keys with a string.
 *
 * @param  obj    Object to create keys from.
 * @param  prefix Prefix used before all keys.
 * @return object
 */
const prefixObjectKeys = (
	obj: { [ key: string ]: unknown },
	prefix: string
) => {
	return Object.fromEntries(
		Object.entries( obj ).map( ( [ k, v ] ) => [ `${ prefix }${ k }`, v ] )
	);
};

/**
 * Initialize all product screen tracks.
 */
export const initProductScreenTracks = () => {
	const initialPublishingData = getPublishingWidgetData();

	document
		.querySelector( '#post-preview' )
		?.addEventListener( 'click', () => {
			recordEvent( 'product_preview_changes' );
		} );

	document
		.querySelector( '.submitduplicate' )
		?.addEventListener( 'click', () => {
			recordEvent( 'product_copy', getProductData() );
		} );

	document
		.querySelector( '.submitdelete' )
		?.addEventListener( 'click', () => {
			recordEvent( 'product_delete', getProductData() );
		} );

	document
		.querySelectorAll(
			'.edit-post-status, .edit-visibility, .edit-timestamp, .edit-catalog-visibility'
		)
		.forEach( ( button ) => {
			button.addEventListener( 'click', () => {
				recordEvent( 'product_publish_widget_edit', {
					...getPublishingWidgetData(),
					...getProductData(),
				} );
			} );
		} );

	document
		.querySelectorAll(
			'.save-post-status, .save-post-visibility, .save-timestamp, .save-post-visibility'
		)
		.forEach( ( button ) => {
			button.addEventListener( 'click', () => {
				recordEvent( 'product_publish_widget_save', {
					...prefixObjectKeys( getPublishingWidgetData(), 'new_' ),
					...prefixObjectKeys( initialPublishingData, 'current_' ),
					...getProductData(),
				} );
			} );
		} );

	document
		.querySelectorAll( '.handle-order-lower, .handle-order-higher' )
		.forEach( ( button ) => {
			button.addEventListener( 'click', ( event ) => {
				const postBox = ( event.target as HTMLElement ).closest(
					'.postbox'
				);

				if ( ! postBox ) {
					return;
				}

				recordEvent( 'product_widget_order_change', {
					widget: postBox.id,
				} );
			} );
		} );

	document
		.querySelector( '#show-settings-link' )
		?.addEventListener( 'click', () => {
			recordEvent( 'product_screen_options_open' );
		} );

	document
		.querySelectorAll( '#adv-settings .metabox-prefs input[type=checkbox]' )
		.forEach( ( input ) => {
			input.addEventListener( 'change', () => {
				recordEvent( 'product_screen_elements', {
					selected_element: ( input as HTMLInputElement ).value,
					checkbox: ( input as HTMLInputElement ).checked,
				} );
			} );
		} );

	document
		.querySelectorAll( 'input[name="screen_columns"]' )
		.forEach( ( input ) => {
			input.addEventListener( 'change', () => {
				recordEvent( 'product_layout', {
					selected_layout: ( input as HTMLInputElement ).value,
				} );
			} );
		} );

	document
		.querySelector( '#editor-expand-toggle' )
		?.addEventListener( 'change', ( event ) => {
			recordEvent( 'product_additional_settings', {
				checkbox: ( event.target as HTMLInputElement ).checked,
			} );
		} );

	// Product tags

	function deleteTagEventListener( event: Event ) {
		recordEvent( 'product_tags_delete', {
			page: 'product',
			tag_list_size:
				document.querySelector( '.tagchecklist' )?.children.length || 0,
		} );
	}

	function addTagsDeleteTracks() {
		const tagsDeleteButtons = document.querySelectorAll(
			'#product_tag .ntdelbutton'
		);
		tagsDeleteButtons.forEach( ( button ) => {
			button.removeEventListener( 'click', deleteTagEventListener );
			button.addEventListener( 'click', deleteTagEventListener );
		} );
	}
	waitUntilElementIsPresent(
		'#product_tag .tagchecklist',
		addTagsDeleteTracks
	);

	document
		.querySelector( '.tagadd' )
		?.addEventListener( 'click', ( event ) => {
			const tagInput = document.querySelector< HTMLInputElement >(
				'#new-tag-product_tag'
			);
			if ( tagInput && tagInput.value && tagInput.value.length > 0 ) {
				recordEvent( 'product_tags_add', {
					page: 'product',
					tag_string_length: tagInput.value.length,
					tag_list_size:
						( document.querySelector( '.tagchecklist' )?.children
							.length || 0 ) + 1,
					most_used: false,
				} );
				setTimeout( () => {
					addTagsDeleteTracks();
				}, 500 );
			}
		} );

	function addMostUsedTagEventListener( event: Event ) {
		recordEvent( 'product_tags_add', {
			page: 'product',
			tag_string_length: ( event.target as HTMLAnchorElement ).textContent
				?.length,
			tag_list_size:
				document.querySelector( '.tagchecklist' )?.children.length || 0,
			most_used: true,
		} );
		addTagsDeleteTracks();
	}

	function addMostUsedTagsTracks() {
		const tagCloudLinks = document.querySelectorAll(
			'#tagcloud-product_tag .tag-cloud-link'
		);
		tagCloudLinks.forEach( ( button ) => {
			button.removeEventListener( 'click', addMostUsedTagEventListener );
			button.addEventListener( 'click', addMostUsedTagEventListener );
		} );
	}

	document
		.querySelector( '.tagcloud-link' )
		?.addEventListener( 'click', () => {
			waitUntilElementIsPresent(
				'#tagcloud-product_tag',
				addMostUsedTagsTracks
			);
		} );

	// Attribute tracks.

	function addNewTermEventHandler() {
		recordEvent( 'product_attributes_add_term', {
			page: 'product',
		} );
	}

	function addNewAttributeTermTracks() {
		const addNewTermButtons = document.querySelectorAll(
			'.woocommerce_attribute .add_new_attribute'
		);
		addNewTermButtons.forEach( ( button ) => {
			button.removeEventListener( 'click', addNewTermEventHandler );
			button.addEventListener( 'click', addNewTermEventHandler );
		} );
	}
	addNewAttributeTermTracks();

	document
		.querySelector( '.add_attribute' )
		?.addEventListener( 'click', () => {
			setTimeout( () => {
				addNewAttributeTermTracks();
			}, 1000 );
		} );

	const attributesCount = document.querySelectorAll(
		'.woocommerce_attribute'
	).length;

	document
		.querySelector( '.save_attributes' )
		?.addEventListener( 'click', () => {
			const newAttributesCount = document.querySelectorAll(
				'.woocommerce_attribute'
			).length;
			if ( newAttributesCount > attributesCount ) {
				recordEvent( 'product_attributes_add', {
					page: 'product',
					enable_archive: '',
					default_sort_order: '',
				} );
			}
		} );
};
