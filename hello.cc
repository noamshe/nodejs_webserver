#include <node.h>
#include <v8.h>
#include "tinyxml.h"
#include "tinystr.h"
#include <iostream>


using namespace v8;
/*
<ToDo>
  <Item priority="1st priority"> item 1</Item>
  <Item priority="2nd priority"> item 2</Item>
</ToDo>
Example:
TiXmlElement* child = doc.FirstChild( "ToDo" )->FirstChild( "Item" )->ToElement();
std::cout << "Attribute from element: " << child->Attribute("priority") << std::endl;
*/

Handle<Value> Method(const Arguments& args) {
  v8::String::Utf8Value param1(args[0]->ToString());
  std::string argStr = std::string(*param1);  
  const char *filedata = argStr.c_str();

  HandleScope scope;

  TiXmlDocument doc;
  doc.Parse((const char*)filedata, 0, TIXML_ENCODING_UTF8);
  TiXmlElement* child = doc.FirstChild("id")->ToElement();

  //std::cout << "element text: " << child->GetText() << std::endl;
  //std::cout << "param from node: " << argStr << std::endl;

  return scope.Close(String::New(child->GetText()));
}

void init(Handle<Object> exports) {
  exports->Set(String::NewSymbol("hello"),
      FunctionTemplate::New(Method)->GetFunction());
}

NODE_MODULE(hello, init)
