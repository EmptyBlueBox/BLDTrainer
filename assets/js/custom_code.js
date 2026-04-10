"use strict";

const default_corner_face_order = "DGJABLYNKISZHFPTECMQWXRO";
const default_edge_face_order = "EGACBQJSHZPRFWNYDTLXIOMK";
const default_corner_buffer_codes = ["J", "A", "G", "D", "W", "O", "R", "X"];
const default_edge_buffer_codes = ["A", "G", "E", "C", "I", "K", "M", "O", "Q", "S", "W", "Y"];
const custom_code_storage_key = "bldtrainer_custom_code_orders";

let custom_code_state = load_custom_code_state();

/**
 * Return the default custom-code state used by the site.
 *
 * Returns
 * -------
 * Object
 *     Plain object with source, target, and resolved order strings for both
 *     corner and edge codes. Each resolved order has shape ``(24,)`` and uses
 *     the ``U, F, R, B, L, D`` face order.
 */
function get_default_custom_code_state() {
    return {
        corner_source: default_corner_face_order,
        corner_target: default_corner_face_order,
        edge_source: default_edge_face_order,
        edge_target: default_edge_face_order,
        corner_order: default_corner_face_order,
        edge_order: default_edge_face_order,
    };
}

/**
 * Normalize a user-provided code-order string.
 *
 * Parameters
 * ----------
 * input_text : string
 *     Raw text typed by the user. The text can contain whitespace or symbols;
 *     only uppercase English letters are kept in the output.
 *
 * Returns
 * -------
 * string
 *     Uppercase code-order string with shape ``(N,)`` where ``0 <= N <= len(input_text)``.
 */
function normalize_code_order(input_text) {
    return String(input_text).toUpperCase().replace(/[^A-Z]/g, "");
}

/**
 * Test whether a code-order string can define a bijection.
 *
 * Parameters
 * ----------
 * code_order : string
 *     Candidate uppercase code-order string with expected shape ``(24,)``.
 *
 * Returns
 * -------
 * boolean
 *     ``true`` when the string contains exactly 24 distinct uppercase letters,
 *     otherwise ``false``.
 */
function is_valid_code_order(code_order) {
    return code_order.length === 24 && new Set(code_order.split("")).size === 24;
}

/**
 * Test whether a replacement-source string is legal for a base order.
 *
 * Parameters
 * ----------
 * source_text : string
 *     Uppercase replacement-source string with shape ``(N,)``.
 * base_order : string
 *     Base uppercase order string with shape ``(24,)``.
 *
 * Returns
 * -------
 * boolean
 *     ``true`` when the string is empty or contains distinct letters drawn
 *     from the base order.
 */
function is_valid_code_source(source_text, base_order) {
    if (source_text === "") {
        return true;
    }
    if (new Set(source_text.split("")).size !== source_text.length) {
        return false;
    }
    for (let i = 0; i < source_text.length; i += 1) {
        if (base_order.indexOf(source_text[i]) === -1) {
            return false;
        }
    }
    return true;
}

/**
 * Test whether a replacement-target string is legal.
 *
 * Parameters
 * ----------
 * target_text : string
 *     Uppercase replacement-target string with shape ``(N,)``.
 *
 * Returns
 * -------
 * boolean
 *     ``true`` when the string is empty or contains distinct uppercase
 *     letters.
 */
function is_valid_code_target(target_text) {
    if (target_text === "") {
        return true;
    }
    return /^[A-Z]+$/.test(target_text) && new Set(target_text.split("")).size === target_text.length;
}

/**
 * Apply a partial replacement rule to a base order string.
 *
 * Parameters
 * ----------
 * base_order : string
 *     Base uppercase order string with shape ``(24,)``.
 * source_text : string
 *     Replacement-source string with shape ``(N,)``.
 * target_text : string
 *     Replacement-target string with shape ``(N,)``.
 *
 * Returns
 * -------
 * string
 *     Resolved uppercase order string with shape ``(24,)``.
 */
function apply_code_replacement(base_order, source_text, target_text) {
    let resolved_order = "";
    for (let i = 0; i < base_order.length; i += 1) {
        const source_index = source_text.indexOf(base_order[i]);
        resolved_order += source_index === -1 ? base_order[i] : target_text[source_index];
    }
    return resolved_order;
}

/**
 * Validate and resolve one replacement rule.
 *
 * Parameters
 * ----------
 * base_order : string
 *     Base uppercase order string with shape ``(24,)``.
 * source_text : string
 *     Raw replacement-source string with arbitrary shape.
 * target_text : string
 *     Raw replacement-target string with arbitrary shape.
 * code_name : string
 *     Human-readable piece-type name used in error messages.
 * silent : boolean
 *     When ``true``, validation failures are returned without alert dialogs.
 *
 * Returns
 * -------
 * Object
 *     Validation result with ``ok`` boolean and resolved ``order`` string when
 *     valid.
 */
function validate_and_resolve_code_rule(base_order, source_text, target_text, code_name, silent) {
    const normalized_source = normalize_code_order(source_text);
    const normalized_target = normalize_code_order(target_text);
    const show_error = function (message) {
        if (!silent) {
            window.alert(message);
        }
    };
    if (normalized_source === "" && normalized_target === "") {
        return { ok: true, source: "", target: "", order: base_order };
    }
    if (!is_valid_code_source(normalized_source, base_order)) {
        show_error(`${code_name}左侧彳亍编码字符串不合法。`);
        return { ok: false };
    }
    if (!is_valid_code_target(normalized_target)) {
        show_error(`${code_name}右侧替换为的字符串不合法。`);
        return { ok: false };
    }
    if (normalized_source.length !== normalized_target.length) {
        show_error(`${code_name}左右字符串长度必须一致。`);
        return { ok: false };
    }
    const resolved_order = apply_code_replacement(base_order, normalized_source, normalized_target);
    if (!is_valid_code_order(resolved_order)) {
        show_error(`${code_name}替换之后的字符串不合法。`);
        return { ok: false };
    }
    return {
        ok: true,
        source: normalized_source,
        target: normalized_target,
        order: resolved_order,
    };
}

/**
 * Build a one-character translation map from two aligned code-order strings.
 *
 * Parameters
 * ----------
 * source_order : string
 *     Source uppercase order string, shape ``(24,)``.
 * target_order : string
 *     Target uppercase order string, shape ``(24,)``.
 *
 * Returns
 * -------
 * Object
 *     Mapping object whose keys and values are uppercase single-character codes.
 */
function build_code_map(source_order, target_order) {
    const code_map = {};
    for (let i = 0; i < source_order.length; i += 1) {
        code_map[source_order[i]] = target_order[i];
    }
    return code_map;
}

/**
 * Recompute forward and reverse maps for the active state.
 *
 * Parameters
 * ----------
 * state : Object
 *     Mutable state object with ``corner_order`` and ``edge_order`` strings,
 *     each shaped as ``(24,)``.
 *
 * Returns
 * -------
 * Object
 *     The same state object after attaching map fields used by the UI layer.
 */
function finalize_custom_code_state(state) {
    state.corner_order = apply_code_replacement(default_corner_face_order, state.corner_source, state.corner_target);
    state.edge_order = apply_code_replacement(default_edge_face_order, state.edge_source, state.edge_target);
    state.corner_map = build_code_map(default_corner_face_order, state.corner_order);
    state.corner_reverse_map = build_code_map(state.corner_order, default_corner_face_order);
    state.edge_map = build_code_map(default_edge_face_order, state.edge_order);
    state.edge_reverse_map = build_code_map(state.edge_order, default_edge_face_order);
    return state;
}

/**
 * Load the persisted custom-code state from browser storage.
 *
 * Returns
 * -------
 * Object
 *     Active state object with normalized orders and translation maps.
 */
function load_custom_code_state() {
    const default_state = get_default_custom_code_state();
    const saved_text = localStorage.getItem(custom_code_storage_key);
    if (saved_text === null) {
        return finalize_custom_code_state(default_state);
    }
    let saved_state = {};
    try {
        saved_state = JSON.parse(saved_text);
    } catch {
        return finalize_custom_code_state(default_state);
    }
    if (typeof saved_state.corner_source === "string" && typeof saved_state.corner_target === "string"
        && typeof saved_state.edge_source === "string" && typeof saved_state.edge_target === "string") {
        const corner_result = validate_and_resolve_code_rule(default_corner_face_order, saved_state.corner_source, saved_state.corner_target, "角块", true);
        const edge_result = validate_and_resolve_code_rule(default_edge_face_order, saved_state.edge_source, saved_state.edge_target, "棱块", true);
        if (corner_result.ok && edge_result.ok) {
            default_state.corner_source = corner_result.source;
            default_state.corner_target = corner_result.target;
            default_state.edge_source = edge_result.source;
            default_state.edge_target = edge_result.target;
        }
    } else {
        const corner_order = normalize_code_order(saved_state.corner_order || "");
        const edge_order = normalize_code_order(saved_state.edge_order || "");
        if (is_valid_code_order(corner_order) && is_valid_code_order(edge_order)) {
            default_state.corner_source = default_corner_face_order;
            default_state.corner_target = corner_order;
            default_state.edge_source = default_edge_face_order;
            default_state.edge_target = edge_order;
        }
    }
    return finalize_custom_code_state(default_state);
}

/**
 * Persist a new custom-code state to browser storage.
 *
 * Parameters
 * ----------
 * corner_source : string
 *     Corner replacement-source string with arbitrary shape.
 * corner_target : string
 *     Corner replacement-target string with arbitrary shape.
 * edge_source : string
 *     Edge replacement-source string with arbitrary shape.
 * edge_target : string
 *     Edge replacement-target string with arbitrary shape.
 *
 * Returns
 * -------
 * boolean
 *     ``true`` when both rules are valid and storage has been updated,
 *     otherwise ``false``.
 */
function save_custom_code_state(corner_source, corner_target, edge_source, edge_target) {
    const corner_result = validate_and_resolve_code_rule(default_corner_face_order, corner_source, corner_target, "角块", false);
    if (!corner_result.ok) {
        return false;
    }
    const edge_result = validate_and_resolve_code_rule(default_edge_face_order, edge_source, edge_target, "棱块", false);
    if (!edge_result.ok) {
        return false;
    }
    custom_code_state = finalize_custom_code_state({
        corner_source: corner_result.source,
        corner_target: corner_result.target,
        edge_source: edge_result.source,
        edge_target: edge_result.target,
    });
    localStorage.setItem(custom_code_storage_key, JSON.stringify({
        corner_source: custom_code_state.corner_source,
        corner_target: custom_code_state.corner_target,
        edge_source: custom_code_state.edge_source,
        edge_target: custom_code_state.edge_target,
    }));
    return true;
}

/**
 * Reset the persisted state back to the site default.
 *
 * Returns
 * -------
 * void
 *     The active state is replaced and written to storage.
 */
function reset_custom_code_state() {
    const default_state = get_default_custom_code_state();
    custom_code_state = finalize_custom_code_state(default_state);
    localStorage.setItem(custom_code_storage_key, JSON.stringify(default_state));
}

/**
 * Translate a text string with a single-piece-type code map.
 *
 * Parameters
 * ----------
 * input_text : string
 *     Arbitrary text that may contain uppercase or lowercase code letters.
 * code_map : Object
 *     Uppercase one-character translation map.
 *
 * Returns
 * -------
 * string
 *     Translated text with non-code characters preserved at the same shape as
 *     the input string.
 */
function translate_code_text(input_text, code_map) {
    let output_text = "";
    const text = String(input_text);
    for (let i = 0; i < text.length; i += 1) {
        const upper_char = text[i].toUpperCase();
        output_text += code_map[upper_char] || text[i];
    }
    return output_text;
}

/**
 * Translate parity text that alternates edge and corner letters.
 *
 * Parameters
 * ----------
 * input_text : string
 *     Arbitrary parity text. Letter characters are interpreted in pair order as
 *     edge, corner, edge, corner, ... with non-letters preserved.
 * reverse : boolean
 *     Direction flag. ``false`` maps canonical to display; ``true`` maps
 *     display to canonical.
 *
 * Returns
 * -------
 * string
 *     Translated parity text with the same character layout as the input.
 */
function translate_parity_text(input_text, reverse) {
    let output_text = "";
    let code_index = 0;
    const edge_map = reverse ? custom_code_state.edge_reverse_map : custom_code_state.edge_map;
    const corner_map = reverse ? custom_code_state.corner_reverse_map : custom_code_state.corner_map;
    const text = String(input_text);
    for (let i = 0; i < text.length; i += 1) {
        const upper_char = text[i].toUpperCase();
        if (/^[A-Z]$/.test(upper_char)) {
            output_text += (code_index % 2 === 0 ? edge_map : corner_map)[upper_char] || text[i];
            code_index += 1;
        } else {
            output_text += text[i];
        }
    }
    return output_text;
}

/**
 * Convert canonical corner text into the user display alphabet.
 *
 * Parameters
 * ----------
 * input_text : string
 *     Canonical corner text with arbitrary shape.
 *
 * Returns
 * -------
 * string
 *     Corner text translated into the configured display alphabet.
 */
function cornerCodeToDisplay(input_text) {
    return translate_code_text(input_text, custom_code_state.corner_map);
}

/**
 * Convert display corner text back into the canonical alphabet.
 *
 * Parameters
 * ----------
 * input_text : string
 *     User-visible corner text with arbitrary shape.
 *
 * Returns
 * -------
 * string
 *     Canonical corner text with the same layout as the input string.
 */
function cornerCodeFromDisplay(input_text) {
    return translate_code_text(input_text, custom_code_state.corner_reverse_map);
}

/**
 * Convert canonical edge text into the user display alphabet.
 *
 * Parameters
 * ----------
 * input_text : string
 *     Canonical edge text with arbitrary shape.
 *
 * Returns
 * -------
 * string
 *     Edge text translated into the configured display alphabet.
 */
function edgeCodeToDisplay(input_text) {
    return translate_code_text(input_text, custom_code_state.edge_map);
}

/**
 * Convert display edge text back into the canonical alphabet.
 *
 * Parameters
 * ----------
 * input_text : string
 *     User-visible edge text with arbitrary shape.
 *
 * Returns
 * -------
 * string
 *     Canonical edge text with the same layout as the input string.
 */
function edgeCodeFromDisplay(input_text) {
    return translate_code_text(input_text, custom_code_state.edge_reverse_map);
}

/**
 * Convert HTML corner text into the user display alphabet without touching tags.
 *
 * Parameters
 * ----------
 * input_html : string
 *     HTML string whose text nodes contain canonical corner codes.
 *
 * Returns
 * -------
 * string
 *     HTML string with the same tag structure and translated text nodes.
 */
function cornerCodeHtmlToDisplay(input_html) {
    const container_node = document.createElement("div");
    container_node.innerHTML = String(input_html);
    const walker = document.createTreeWalker(container_node, NodeFilter.SHOW_TEXT);
    let current_node = walker.nextNode();
    while (current_node !== null) {
        current_node.textContent = cornerCodeToDisplay(current_node.textContent);
        current_node = walker.nextNode();
    }
    return container_node.innerHTML;
}

/**
 * Convert HTML edge text into the user display alphabet without touching tags.
 *
 * Parameters
 * ----------
 * input_html : string
 *     HTML string whose text nodes contain canonical edge codes.
 *
 * Returns
 * -------
 * string
 *     HTML string with the same tag structure and translated text nodes.
 */
function edgeCodeHtmlToDisplay(input_html) {
    const container_node = document.createElement("div");
    container_node.innerHTML = String(input_html);
    const walker = document.createTreeWalker(container_node, NodeFilter.SHOW_TEXT);
    let current_node = walker.nextNode();
    while (current_node !== null) {
        current_node.textContent = edgeCodeToDisplay(current_node.textContent);
        current_node = walker.nextNode();
    }
    return container_node.innerHTML;
}

/**
 * Convert canonical parity text into the user display alphabet.
 *
 * Parameters
 * ----------
 * input_text : string
 *     Canonical parity text whose letter sequence alternates edge and corner
 *     codes.
 *
 * Returns
 * -------
 * string
 *     Display parity text with the same layout as the input string.
 */
function parityCodeToDisplay(input_text) {
    return translate_parity_text(input_text, false);
}

/**
 * Convert display parity text back into the canonical alphabet.
 *
 * Parameters
 * ----------
 * input_text : string
 *     Display parity text whose letter sequence alternates edge and corner
 *     codes.
 *
 * Returns
 * -------
 * string
 *     Canonical parity text with the same layout as the input string.
 */
function parityCodeFromDisplay(input_text) {
    return translate_parity_text(input_text, true);
}

/**
 * Test whether a display character belongs to the active corner alphabet.
 *
 * Parameters
 * ----------
 * input_char : string
 *     Single-character display input with shape ``(1,)``.
 *
 * Returns
 * -------
 * boolean
 *     ``true`` when the uppercase character is present in the configured corner
 *     alphabet.
 */
function isCornerDisplayChar(input_char) {
    return Object.prototype.hasOwnProperty.call(custom_code_state.corner_reverse_map, String(input_char).toUpperCase());
}

/**
 * Test whether a display character belongs to the active edge alphabet.
 *
 * Parameters
 * ----------
 * input_char : string
 *     Single-character display input with shape ``(1,)``.
 *
 * Returns
 * -------
 * boolean
 *     ``true`` when the uppercase character is present in the configured edge
 *     alphabet.
 */
function isEdgeDisplayChar(input_char) {
    return Object.prototype.hasOwnProperty.call(custom_code_state.edge_reverse_map, String(input_char).toUpperCase());
}

/**
 * Replace a select element with canonical values and translated labels.
 *
 * Parameters
 * ----------
 * select_id : string
 *     DOM id for the target ``<select>`` element.
 * canonical_options : string[]
 *     Canonical option list, shape ``(N,)``.
 * code_type : string
 *     Either ``"corner"`` or ``"edge"``.
 *
 * Returns
 * -------
 * void
 *     The existing select options are replaced in-place.
 */
function render_code_select(select_id, canonical_options, code_type) {
    const select_node = document.getElementById(select_id);
    if (select_node === null) {
        return;
    }
    const selected_value = select_node.value || canonical_options[0];
    select_node.innerHTML = canonical_options.map((code) => {
        const display_code = code_type === "corner" ? cornerCodeToDisplay(code) : edgeCodeToDisplay(code);
        return `<option value="${code}">${display_code}</option>`;
    }).join("");
    select_node.value = selected_value;
}

/**
 * Replace an input element value with its translated display string.
 *
 * Parameters
 * ----------
 * input_id : string
 *     DOM id for the target ``<input>`` element.
 * code_type : string
 *     Either ``"corner"`` or ``"edge"``.
 *
 * Returns
 * -------
 * void
 *     The current input value is translated from canonical to display text.
 */
function render_code_input(input_id, code_type) {
    const input_node = document.getElementById(input_id);
    if (input_node === null) {
        return;
    }
    input_node.value = code_type === "corner"
        ? cornerCodeToDisplay(input_node.value)
        : edgeCodeToDisplay(input_node.value);
}

/**
 * Replace checkbox label text with translated display codes.
 *
 * Parameters
 * ----------
 * container_id : string
 *     DOM id for the checkbox container element.
 * code_type : string
 *     Either ``"corner"`` or ``"edge"``.
 *
 * Returns
 * -------
 * void
 *     Matching labels are updated in-place.
 */
function render_code_checkbox_labels(container_id, code_type) {
    const container_node = document.getElementById(container_id);
    if (container_node === null) {
        return;
    }
    const checkbox_nodes = container_node.querySelectorAll("input[type='checkbox']");
    for (let i = 0; i < checkbox_nodes.length; i += 1) {
        const label_node = container_node.querySelector(`label[for="${checkbox_nodes[i].id}"]`);
        if (label_node === null) {
            continue;
        }
        label_node.textContent = code_type === "corner"
            ? cornerCodeToDisplay(checkbox_nodes[i].id)
            : edgeCodeToDisplay(checkbox_nodes[i].id);
    }
}

/**
 * Refresh homepage form inputs and reference text.
 *
 * Returns
 * -------
 * void
 *     Homepage-only elements are synchronized with the active state.
 */
function sync_custom_code_form() {
    const corner_source_input = document.getElementById("custom_corner_code_source");
    const corner_target_input = document.getElementById("custom_corner_code_target");
    const edge_source_input = document.getElementById("custom_edge_code_source");
    const edge_target_input = document.getElementById("custom_edge_code_target");
    if (corner_source_input === null || corner_target_input === null || edge_source_input === null || edge_target_input === null) {
        return;
    }
    corner_source_input.value = custom_code_state.corner_source;
    corner_target_input.value = custom_code_state.corner_target;
    edge_source_input.value = custom_code_state.edge_source;
    edge_target_input.value = custom_code_state.edge_target;
}

/**
 * Save homepage form values and refresh the current page.
 *
 * Returns
 * -------
 * void
 *     Browser storage and current-page UI are updated in-place.
 */
function save_custom_code_form() {
    const corner_source_input = document.getElementById("custom_corner_code_source");
    const corner_target_input = document.getElementById("custom_corner_code_target");
    const edge_source_input = document.getElementById("custom_edge_code_source");
    const edge_target_input = document.getElementById("custom_edge_code_target");
    if (corner_source_input === null || corner_target_input === null || edge_source_input === null || edge_target_input === null) {
        return;
    }
    if (save_custom_code_state(
        corner_source_input.value,
        corner_target_input.value,
        edge_source_input.value,
        edge_target_input.value,
    )) {
        apply_custom_code_page();
        window.alert("自定义编码已保存。");
    }
}

/**
 * Reset homepage form values back to the default site alphabet.
 *
 * Returns
 * -------
 * void
 *     Browser storage and current-page UI are updated in-place.
 */
function reset_custom_code_form() {
    reset_custom_code_state();
    apply_custom_code_page();
    window.alert("已恢复默认编码。");
}

/**
 * Attach homepage form events when the form exists.
 *
 * Returns
 * -------
 * void
 *     Event handlers are registered once for the save and reset buttons.
 */
function setup_custom_code_form() {
    const save_button = document.getElementById("save_custom_code");
    const reset_button = document.getElementById("reset_custom_code");
    if (save_button === null || reset_button === null) {
        return;
    }
    save_button.onclick = save_custom_code_form;
    reset_button.onclick = reset_custom_code_form;
}

/**
 * Apply the active custom-code state to the current page DOM.
 *
 * Returns
 * -------
 * void
 *     Visible code labels and default inputs are rewritten for the current
 *     document.
 */
function apply_custom_code_page() {
    render_code_select("cornerbuffer", default_corner_buffer_codes, "corner");
    render_code_select("edgebuffer", default_edge_buffer_codes, "edge");
    render_code_input("cornerorder", "corner");
    render_code_input("edgeorder", "edge");
    render_code_input("cornerfloatorder", "corner");
    render_code_input("cornerejectpos", "corner");
    render_code_input("edgefloatorder", "edge");
    render_code_input("edgeejectpos", "edge");
    if (document.getElementById("flipstate") !== null) {
        render_code_checkbox_labels("codeselect", "edge");
    }
    if (document.getElementById("twiststate") !== null) {
        render_code_checkbox_labels("codeselect", "corner");
    }
    sync_custom_code_form();
    setup_custom_code_form();
}

window.cornerCodeToDisplay = cornerCodeToDisplay;
window.cornerCodeFromDisplay = cornerCodeFromDisplay;
window.cornerCodeHtmlToDisplay = cornerCodeHtmlToDisplay;
window.edgeCodeToDisplay = edgeCodeToDisplay;
window.edgeCodeFromDisplay = edgeCodeFromDisplay;
window.edgeCodeHtmlToDisplay = edgeCodeHtmlToDisplay;
window.parityCodeToDisplay = parityCodeToDisplay;
window.parityCodeFromDisplay = parityCodeFromDisplay;
window.isCornerDisplayChar = isCornerDisplayChar;
window.isEdgeDisplayChar = isEdgeDisplayChar;
window.applyCustomCodePage = apply_custom_code_page;

apply_custom_code_page();
