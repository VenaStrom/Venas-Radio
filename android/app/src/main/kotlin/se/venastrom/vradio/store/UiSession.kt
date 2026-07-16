package se.venastrom.vradio.store

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

/**
 * The web's sessionStorage, roughly: UI state that should survive leaving and
 * re-entering a page (tab switches dispose the page composable, taking any
 * remembered state with it) but deliberately not process death. Nothing here
 * is ever written to disk — that is [LocalStore]'s job.
 */
object UiSession {
  /** The SEARCH tab's query. */
  var searchQuery by mutableStateOf("")

  /** The FEED tab's filter query. */
  var feedQuery by mutableStateOf("")
}
