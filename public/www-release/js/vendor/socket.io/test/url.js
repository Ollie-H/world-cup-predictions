var old=global.location,loc={},url=require("../lib/url"),expect=require("expect.js");describe("url",function(){it("works with relative paths",function(){loc.hostname="woot.com",loc.protocol="https:";var e=url("/test",loc);expect(e.host).to.be("woot.com"),expect(e.protocol).to.be("https")}),it("works with no protocol",function(){loc.protocol="http:";var e=url("localhost:3000",loc);expect(e.host).to.be("localhost"),expect(e.port).to.be("3000"),expect(e.protocol).to.be("http")}),it("ignores default ports for unique url ids",function(){var e=url("http://google.com:80/"),t=url("http://google.com/"),n=url("https://google.com/");expect(e.id).to.be(t.id),expect(e.id).to.not.be(n.id)}),it("identifies the namespace",function(){loc.protocol="http:",loc.hostname="woot.com",expect(url("/woot").path).to.be("/woot"),expect(url("http://google.com").path).to.be("/"),expect(url("http://google.com/").path).to.be("/")})});