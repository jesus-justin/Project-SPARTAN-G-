import 'dart:html' as html;

Future<void> saveWebString(String key, String value) async {
  html.window.localStorage[key] = value;
}

Future<String?> readWebString(String key) async {
  return html.window.localStorage[key];
}

Future<void> removeWebString(String key) async {
  html.window.localStorage.remove(key);
}

bool hasWebString(String key) => html.window.localStorage.containsKey(key) && html.window.localStorage[key] != null && html.window.localStorage[key]!.isNotEmpty;

String? readWebStringSync(String key) => html.window.localStorage[key];
