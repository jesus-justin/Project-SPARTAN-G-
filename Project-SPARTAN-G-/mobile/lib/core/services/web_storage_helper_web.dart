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
