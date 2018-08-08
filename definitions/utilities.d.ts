/*
 *                            *** MIT LICENSE ***
 * -------------------------------------------------------------------------
 * This code may be modified and distributed under the MIT license.
 * See the LICENSE file for details.
 * -------------------------------------------------------------------------
 *
 * @summary   Definitions for redux-logic
 *
 * @author    Alvis HT Tang <alvis@hilbert.space>
 * @license   MIT
 * @copyright Copyright (c) 2018 - All Rights Reserved.
 * -------------------------------------------------------------------------
 */

//
// UTILITIES
//

/** a simple helper for overring properties */
export type Override<A, B> = {
  [K in keyof A]: K extends keyof B ? B[K] : A[K]
};

/** a simple helper type for accepting undfined */
export type Object = object | undefined;
