/*
 *                            *** MIT LICENSE ***
 * -------------------------------------------------------------------------
 * This code may be modified and distributed under the MIT license.
 * See the LICENSE file for details.
 * -------------------------------------------------------------------------
 *
 * @summary   Shared types for typechecking
 *
 * @author    Alvis HT Tang <alvis@hilbert.space>
 * @license   MIT
 * @copyright Copyright (c) 2018 - All Rights Reserved.
 * -------------------------------------------------------------------------
 */

export interface Dependency {
  depKey: string;
  optKey?: string;
}

export interface Meta {
  metaKey: string;
}

export interface Payload {
  payloadKey: number;
}

export interface State {
  stateKey: string;
}
