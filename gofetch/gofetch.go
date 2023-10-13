package main

import (
	"errors"
	"fmt"
	"os"
	"os/user"
	"strconv"
	"strings"
	"time"

	"github.com/mackerelio/go-osstat/memory"
	"github.com/mackerelio/go-osstat/uptime"
)

func getKernel() (k *string, err error) {
	f, e := os.ReadFile("/proc/version")
	if e != nil {

		return nil, e
	}

	split := strings.Split(string(f), " ")

	if len(split) >= 3 {
		return &split[2], nil
	}

	return nil, errors.New("Failed to read kernel")
}

func getCpuName() (k *string, err error) {
	f, e := os.ReadFile("/proc/cpuinfo")
	if e != nil {
		return nil, e
	}

	split := strings.Split(string(f), "\n")

	var cores []string

	for _, s := range split {
		if strings.Contains(s, "model name") {
			nameStart := strings.IndexRune(s, ':')
			cores = append(cores, s[nameStart+2:])
		}
	}

	ostr := fmt.Sprintf("%dx %s", len(cores), cores[0])
	return &ostr, nil
}

const GIGABYTE float32 = 1024 * 1024 * 1024

const (
	BLACK = iota + 30
	RED
	GREEN
	YELLOW
	BLUE
	MAGENTA
	CYAN
	WHITE
	BR_BLACK = iota + 82
	BR_RED
	BR_GREEN
	BR_YELLOW
	BR_BLUE
	BR_MAGENTA
	BR_CYAN
	BR_WHITE
)

var colors = []byte{
	BLACK,
	BR_BLACK,
	RED,
	BR_RED,
	GREEN,
	BR_GREEN,
	YELLOW,
	BR_YELLOW,
	BLUE,
	BR_BLUE,
	MAGENTA,
	BR_MAGENTA,
	CYAN,
	BR_CYAN,
	WHITE,
	BR_WHITE,
}

func color(c byte) string {
	return fmt.Sprintf("\x1b[%dm", c)
}

var argh = []string{
	"      /\\        ",
	"     /  \\       ",
	"    /\\   \\      ",
	"   /      \\     ",
	"  /   ,,   \\    ",
	" /   |  |  -\\   ",
	"/_-''    ''-_\\  ",
}

func getUsername() string {
	u, e := user.Current()

	if e != nil {
		panic("getUsername failed")
	}

	return u.Username
}

func getHostname() string {
	h, e := os.Hostname()

	if e != nil {
		panic("getHostname failed")
	}

	return h
}

func formatUptime(d time.Duration) string {
	h := int(d.Hours())

	days := h / 24

	h %= 24

	ostr := strings.Builder{}

	if days > 0 {
		ostr.WriteString(strconv.Itoa(days))
		ostr.WriteString("d ")
	}

	if h > 0 {
		ostr.WriteString(strconv.Itoa(h))
		ostr.WriteString("h")
	}

	return ostr.String()
}

func bar() {
	for _, col := range colors {
		print(color(col), "====", color(0))
	}
}

func main() {
	m, e := memory.Get()
	if e != nil {
		panic(e)
	}
	c, e := getCpuName()
	if e != nil {
		panic(e)
	}
	u, e := uptime.Get()
	if e != nil {
		panic(e)
	}
	k, e := getKernel()
	if e != nil {
		panic(e)
	}

	var linez = []string{
		fmt.Sprintf("%s%s%s@%s%s\n", color(BR_GREEN), getUsername(), color(BR_WHITE), color(BR_BLUE), getHostname()),
		"\n",
		fmt.Sprintf("%sCPU: %s%s\n", color(0), color(1), *c),
		fmt.Sprintf("%sUp:  %s%s\n", color(0), color(1), formatUptime(u)),
		fmt.Sprintf("%sMemory: %s%.2f/%.2fGiB\n", color(0), color(1), float32(m.Used)/GIGABYTE, float32(m.Total)/GIGABYTE),
		fmt.Sprintf("%sKernel: %s%s\n", color(0), color(1), *k),
	}
	var sz = max(len(linez), len(argh))

	bar()
	print("\n\n")

	print(color(1))

	for i := 0; i < sz; i++ {
		print(color(BR_CYAN))
		print(" ")
		if i < len(argh) {
			print(argh[i])
		} else {
			print("               ")
		}
		print(color(BR_MAGENTA))
		if i < len(linez) {
			print(linez[i])
		}

	}

	print("\n\n")
	bar()
	print("\n")
	print("\x1b[39;49m")
}
